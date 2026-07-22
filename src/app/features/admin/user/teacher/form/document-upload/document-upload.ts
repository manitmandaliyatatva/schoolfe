import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonButtonConfig } from '../../../../../../shared/components/button/model/button.model';
import { CommonDataGridComponent } from '../../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGrid, CommonDataGridColumnConfig } from '../../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../../shared/constants/api-url';
import { buildGridToolbarButton } from '../../../../../../shared/helpers/grid.helper';
import FileHelper from '../../../../../../shared/helpers/file.helper';
import { Base64Document } from '../../../../../../shared/models/document.model';
import { CommonDropdownStore } from '../../../../../../core/store/common-dropdown.store';
import CommonHelper from '../../../../../../core/helpers/common-helper';
import { TeacherDocument, TeacherDocumentBase64, teacherDocumentBase64Store, teacherDocumentStore } from '../../models/teacher-document.model';
import { AddTeacherDocumentDialog, AddTeacherDocumentDialogResult } from './add-teacher-document-dialog/add-teacher-document-dialog';
import { ConfirmationService } from '../../../../../../shared/services/dialog.service';
import { GenericDialogService } from '../../../../../../shared/services/generic-dialog.service';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import { CommonHelperService } from '../../../../../../core/services/common-helper.service';
import { StatusChipComponent } from '../../../../../../shared/components/status-chip/status-chip.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY_GUID } from '../../../../../../shared/constants/app.constants';
import { ToastrHelperService } from '../../../../../../core/services/toster-helper.service';

@UntilDestroy()
@Component({
  selector: 'app-teacher-document-upload',
  standalone: true,
  imports: [CommonModule, CommonDataGridComponent, StatusChipComponent],
  providers: [teacherDocumentStore, teacherDocumentBase64Store],
  templateUrl: './document-upload.html'
})
export class TeacherDocumentUpload implements OnInit, OnDestroy {
  private static readonly DOCUMENT_TYPE_DROPDOWN_KEY = 'teacherDocumentType';

  private readonly route = inject(ActivatedRoute);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly confirmService = inject(ConfirmationService);
  private readonly genericDialogService = inject(GenericDialogService);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly tostrService = inject(ToastrHelperService);
  readonly teacherDocumentStore = inject(teacherDocumentStore);
  readonly teacherDocumentBase64Store = inject(teacherDocumentBase64Store);
  readonly documentTypeDropdownList = this.dropdownStore.getList(TeacherDocumentUpload.DOCUMENT_TYPE_DROPDOWN_KEY);
  private readonly teacherId = signal<string | null>(null);
  private readonly pendingDocumentAction = signal<{ row: TeacherDocument; mode: 'download' | 'view' } | null>(null);
  isUpdated = signal(false);

  readonly availableDocumentTypeOptions = computed(() => {
    const rawData = this.teacherDocumentStore.data();
    const list = Array.isArray(rawData) ? rawData : [];
    const selectedDocumentTypeIds = new Set(
      list
        .filter((item) => !item.isDeleted)
        .map((item) => item.documentTypeId)
        .filter((id) => !CommonHelper.isEmpty(id))
    );

    const docTypeDropdownList = this.documentTypeDropdownList();
    return Array.isArray(docTypeDropdownList)
      ? docTypeDropdownList.filter((option) => !selectedDocumentTypeIds.has(String(option.value)))
      : [];
  });

  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<unknown>;

  documentGridConfig!: CommonDataGrid<TeacherDocument>;

  readonly addBtn = signal<CommonButtonConfig>(buildGridToolbarButton({
    tooltipText: this.commonHelperService.handleButtonText(SYSTEM_CONST.LABELS.DOCUMENTS.FILE),
    icon: 'add_2',
    callback: () => this.onAddClick(),
    disableCallBack: () => CommonHelper.isEmpty(this.teacherId()),
    isPrimary: true
  }));

  constructor() {

    effect(() => {
      const pendingAction = this.pendingDocumentAction();
      if (!pendingAction || this.teacherDocumentBase64Store.isLoading()) return;

      const documentBase64Data = this.teacherDocumentBase64Store.data() as TeacherDocumentBase64 | null;
      this.pendingDocumentAction.set(null);
      if (!documentBase64Data) return;

      this.handleDocumentAction(
        pendingAction.row,
        pendingAction.mode,
        documentBase64Data.base64,
        documentBase64Data.contentType,
        documentBase64Data.fileName
      );
    });
  }

  ngOnInit(): void {
    this.teacherDocumentStore.resetState();
    this.teacherId.set(this.resolveTeacherId());
    this.documentGridConfig = this.buildGridConfig();
    this.loadDocumentTypeDropdown();
  }

  ngOnDestroy(): void {
    this.dropdownStore.resetState();
    this.teacherDocumentStore.resetState();
    this.teacherDocumentBase64Store.resetState();
  }

  private resolveTeacherId = (): string | null => {
    const teacherIdParam = this.route.snapshot.paramMap.get('teacherId');
    return CommonHelper.isEmpty(teacherIdParam) ? null : teacherIdParam;
  };

  private buildGridConfig = (): CommonDataGrid<TeacherDocument> => {
    return {
      id: 'admin-teacher-document-grid',
      primaryKey: 'teacherDocumentId',
      columns: this.buildColumns(),
      actionButtons: [
        {
          buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
          matIconName: 'visibility',
          callback: this.onViewClick,
          disableCallback: (row) => row.isDeleted || (!this.hasDocumentPath(row) && !this.hasLocalDocument(row)),
        },
        {
          buttonText: SYSTEM_CONST.ACTION_BUTTONS.DOWNLOAD,
          matIconName: 'download',
          callback: this.onDownloadClick,
          disableCallback: (row) => row.isDeleted || (!this.hasDocumentPath(row) && !this.hasLocalDocument(row)),
        },
        {
          buttonText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
          matIconName: 'delete',
          callback: this.onDeleteClick,
          disableCallback: (row) => row.isDeleted,
        },
      ],
      signalStore: {
        load: () => this.loadDocuments(),
        list: () => this.teacherDocumentStore.data() ?? [],
        recordsFiltered: () => (this.teacherDocumentStore.data() ?? []).length,
        isLoading: () => this.teacherDocumentStore.isLoading(),
      },
      addButton: this.addBtn()
    };
  };

  private loadDocuments = (): void => {
    if (CommonHelper.isEmpty(this.teacherId())) {
      this.teacherDocumentStore.setData([]);
      return;
    }

    this.teacherDocumentStore.getById({
      endpoint: API.ADMIN.USER.TEACHER.GETTEACHERDOCUMENT,
      params: { teacherId: this.teacherId() },
    });
  };

  private loadDocumentTypeDropdown = (): void => {
    this.dropdownStore.getDropdown({
      key: TeacherDocumentUpload.DOCUMENT_TYPE_DROPDOWN_KEY,
      endpoint: API.ADMIN.CONFIGURATION.DOCUMENT_TYPE.DROPDOWN,
    });
  };

  private buildColumns = (): CommonDataGridColumnConfig<TeacherDocument>[] => {
    return [
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.TEACHER_DOCUMENT_ID,
        field: 'teacherDocumentId',
        isHidden: true,
      },
      {
        title: SYSTEM_CONST.LABELS.DOCUMENTS.TYPE,
        field: 'documentTypeName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.DOCUMENTS.FILE,
        field: 'documentName',
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.statusTemplate,
        isSortable: true,
      },
    ];
  };

  private onDeleteClick = (row: TeacherDocument): void => {
    this.confirmService
      .confirm({
        title: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        message: SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.documentTypeName ?? SYSTEM_CONST.LABELS.DOCUMENTS.FILE),
        confirmText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
      })
      .pipe(untilDestroyed(this))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.isUpdated.set(true);
        const isNew = CommonHelper.isEmpty(row.teacherDocumentId) || !row.documentPath;
        const items = this.teacherDocumentStore.data() || [];
        let updatedList;
        if (isNew) {
          updatedList = items.filter((item) => item !== row);
        } else {
          updatedList = items.map((item) =>
            item.teacherDocumentId === row.teacherDocumentId ? { ...item, isDeleted: true, isActive: false } : item
          );
        }
        this.teacherDocumentStore.setData(updatedList);
      });
  };

  onSave = (teacherId?: string): void => {
    const resolvedTeacherId = teacherId ?? this.teacherId();
    if (!this.isUpdated() || CommonHelper.isEmpty(resolvedTeacherId)) return;
    const items = this.teacherDocumentStore.data() || [];
    const payload = items.map((item) => ({
      ...item,
      teacherId: resolvedTeacherId,
      documentName: item.documentName?.trim()
        || FileHelper.getFileNameFromPath(item.documentPath)
        || item.documentTypeName
        || '',
    }));

    this.teacherDocumentStore.create({
      endpoint: API.ADMIN.USER.TEACHER.ADDUPDATETEACHERDOCUMENT,
      body: payload,
    });
  };

  onAddClick = (): void => {
    if (CommonHelper.isEmpty(this.teacherId())) return;
    const availableOptions = this.availableDocumentTypeOptions();
    if (!availableOptions.length) {
      const allOptions = this.documentTypeDropdownList();
      const hasOptions = Array.isArray(allOptions) && allOptions.length > 0;
      const warningMsg = hasOptions
        ? SYSTEM_CONST.MESSAGES.WARNING.ALL_DOCUMENTS_ADDED
        : SYSTEM_CONST.MESSAGES.WARNING.NO_DOCUMENTS;
      this.tostrService.showWarningMessage(warningMsg);
      return;
    }

    this.genericDialogService.open({
      width: '520px',
      title: `${SYSTEM_CONST.ACTION_BUTTONS.ADD} ${SYSTEM_CONST.LABELS.DOCUMENTS.FILE}`,
      component: AddTeacherDocumentDialog,
      data: { documentTypes: availableOptions },
    }).afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((result: AddTeacherDocumentDialogResult | null | undefined) => {
        if (!result) return;
        this.isUpdated.set(true);
        this.addDocumentRow(result);
      });
  };

  private addDocumentRow = (result: AddTeacherDocumentDialogResult): void => {
    const updatedList = [
      ...(this.teacherDocumentStore.data() || []),
      {
        teacherDocumentId: EMPTY_GUID,
        teacherId: this.teacherId(),
        documentTypeId: result.documentTypeId,
        documentTypeName: result.documentTypeName,
        documentName: result.documentName,
        document: result.document,
        documentPath: null,
        isActive: true,
        isDeleted: false,
      },
    ];
    this.teacherDocumentStore.setData(updatedList);
  };

  private onDownloadClick = (row: TeacherDocument): void => {
    this.requestDocumentAction(row, 'download');
  };

  private onViewClick = (row: TeacherDocument): void => {
    this.requestDocumentAction(row, 'view');
  };

  private hasDocumentPath = (row: TeacherDocument): boolean => {
    return !!row.documentPath?.trim();
  };

  private hasLocalDocument = (row: TeacherDocument): boolean => {
    return !!FileHelper.normalizeBase64(row.document);
  };

  private requestDocumentAction = (row: TeacherDocument, mode: 'download' | 'view'): void => {
    if (row.isDeleted) return;

    const localDocumentBase64 = FileHelper.normalizeBase64(row.document);
    if (localDocumentBase64) {
      this.handleDocumentAction(row, mode, row.document);
      return;
    }

    if (!this.hasDocumentPath(row) || CommonHelper.isEmpty(row.teacherDocumentId)) return;

    this.pendingDocumentAction.set({ row, mode });
    this.teacherDocumentBase64Store.resetState();
    this.teacherDocumentBase64Store.getById({
      endpoint: API.ADMIN.USER.TEACHER.GETTEACHERDOCUMENTBASE64,
      params: { teacherDocumentId: row.teacherDocumentId },
    });
  };

  private handleDocumentAction = (
    row: TeacherDocument,
    mode: 'download' | 'view',
    rawBase64: string | null | undefined,
    rawMimeType?: string | null,
    rawFileName?: string | null
  ): void => {
    const normalizedBase64 = FileHelper.normalizeBase64(rawBase64);
    if (!normalizedBase64) return;

    const fileName = rawFileName || row.documentName?.trim() || this.resolveFileName(row, rawMimeType ?? null);
    const contentType = FileHelper.resolveContentType(rawMimeType, fileName, rawBase64);

    if (mode === 'download') {
      FileHelper.downloadBase64(normalizedBase64, fileName, contentType);
      return;
    }

    const viewerData: Base64Document = {
      base64: normalizedBase64,
      contentType,
      fileName,
    };
    this.genericDialogService.openDocumentViewer(viewerData, fileName);
  };

  private resolveFileName = (row: TeacherDocument, mimeType: string | null): string => {
    const pathFileName = FileHelper.getFileNameFromPath(row.documentPath);
    if (pathFileName) return pathFileName;

    const baseName = (row.documentTypeName || 'document').trim().replace(/\s+/g, '_');
    const extension = FileHelper.getFileExtensionFromMimeType(mimeType);
    return `${baseName}_${row.teacherDocumentId}${extension}`;
  };
}

