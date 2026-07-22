import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../../core/helpers/common-helper';
import { CommonHelperService } from '../../../../../../core/services/common-helper.service';
import { CommonDropdownStore } from '../../../../../../core/store/common-dropdown.store';
import { CommonButtonConfig } from '../../../../../../shared/components/button/model/button.model';
import { CommonDataGridComponent } from '../../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGrid, CommonDataGridColumnConfig } from '../../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../../shared/constants/api-url';
import { buildGridToolbarButton } from '../../../../../../shared/helpers/grid.helper';
import FileHelper from '../../../../../../shared/helpers/file.helper';
import { Base64Document } from '../../../../../../shared/models/document.model';
import { ITextValueOption } from '../../../../../../shared/models/common.model';
import { ConfirmationService } from '../../../../../../shared/services/dialog.service';
import { GenericDialogService } from '../../../../../../shared/services/generic-dialog.service';
import { StudentDocument, StudentDocumentBase64, studentDocumentBase64Store, studentDocumentStore } from '../../models/student-document.model';
import { AddStudentDocumentDialog, AddStudentDocumentDialogResult } from './add-student-document-dialog/add-student-document-dialog';
import { StatusChipComponent } from '../../../../../../shared/components/status-chip/status-chip.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY_GUID } from '../../../../../../shared/constants/app.constants';
import { ToastrHelperService } from '../../../../../../core/services/toster-helper.service';

@UntilDestroy()
@Component({
  selector: 'app-document-upload',
  imports: [CommonModule, CommonDataGridComponent, StatusChipComponent],
  providers: [studentDocumentStore, studentDocumentBase64Store],
  templateUrl: './document-upload.html'
})
export class DocumentUpload implements OnInit, OnDestroy {
  private static readonly DOCUMENT_TYPE_DROPDOWN_KEY = 'studentDocumentType';

  private readonly route = inject(ActivatedRoute);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly confirmService = inject(ConfirmationService);
  private readonly genericDialogService = inject(GenericDialogService);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly tostrService = inject(ToastrHelperService);
  readonly studentDocumentStore = inject(studentDocumentStore);
  readonly studentDocumentBase64Store = inject(studentDocumentBase64Store);
  readonly documentTypeDropdownList = this.dropdownStore.getList(DocumentUpload.DOCUMENT_TYPE_DROPDOWN_KEY);
  private readonly studentId = signal<string | null>(null);
  private readonly pendingDocumentAction = signal<{ row: StudentDocument; mode: 'download' | 'view' } | null>(null);
  private readonly documentTypeOptions = signal<ITextValueOption[]>([]);
  readonly availableDocumentTypeOptions = computed(() => {
    const rawData = this.studentDocumentStore.data();
    const list = Array.isArray(rawData) ? rawData : [];
    const selectedDocumentTypeIds = new Set(
      list
        .filter((item) => !item.isDeleted)
        .map((item) => item.documentTypeId)
        .filter((id) => !CommonHelper.isEmpty(id))
    );

    const docTypeOptions = this.documentTypeOptions();
    return Array.isArray(docTypeOptions) 
      ? docTypeOptions.filter((option) => !selectedDocumentTypeIds.has(String(option.value)))
      : [];
  });

  isUpdated = signal(false);
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<unknown>;

  documentGridConfig!: CommonDataGrid<StudentDocument>;

  readonly addBtn = signal<CommonButtonConfig>(buildGridToolbarButton({
    tooltipText: this.commonHelperService.handleButtonText(SYSTEM_CONST.LABELS.DOCUMENTS.FILE),
    icon: 'add_2',
    callback: () => this.onAddClick(),
    disableCallBack: () => CommonHelper.isEmpty(this.studentId()),
    isPrimary: true
  }));

  constructor() {

    effect(() => {
      const options = this.documentTypeDropdownList();
      this.documentTypeOptions.set(options);
    });

    effect(() => {
      const pendingAction = this.pendingDocumentAction();
      if (!pendingAction) return;
      if (this.studentDocumentBase64Store.isLoading()) return;

      const documentBase64Data = this.studentDocumentBase64Store.data() as StudentDocumentBase64 | null;
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
    this.studentDocumentStore.resetState();
    this.studentId.set(this.resolveStudentId());
    this.documentGridConfig = this.buildGridConfig();
    this.loadDocumentTypeDropdown();
  }

  ngOnDestroy(): void {
    this.dropdownStore.resetState();
    this.studentDocumentStore.resetState();
    this.studentDocumentBase64Store.resetState();
  }

  private resolveStudentId = (): string => {
    const studentIdParam = this.route.snapshot.paramMap.get('studentId');
    if (CommonHelper.isEmpty(studentIdParam)) return null;
    return studentIdParam;
  };

  private buildGridConfig = (): CommonDataGrid<StudentDocument> => {
    return {
      id: 'admin-student-document-grid',
      primaryKey: 'studentDocumentId',
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
        list: () => this.studentDocumentStore.data() ?? [],
        recordsFiltered: () => (this.studentDocumentStore.data() ?? []).length,
        isLoading: () => this.studentDocumentStore.isLoading(),
      },
      addButton: this.addBtn()
    };
  };

  private loadDocuments = (): void => {
    if (CommonHelper.isEmpty(this.studentId())) {
      this.studentDocumentStore.setData([]);
      return;
    }

    this.studentDocumentStore.getById({
      endpoint: API.ADMIN.USER.STUDENT.GETSTUDENTDOCUMENT,
      params: { studentId: this.studentId() },
    });
  };

  private loadDocumentTypeDropdown = (): void => {
    this.dropdownStore.getDropdown({
      key: DocumentUpload.DOCUMENT_TYPE_DROPDOWN_KEY,
      endpoint: API.ADMIN.CONFIGURATION.DOCUMENT_TYPE.DROPDOWN,
    });
  };

  private buildColumns = (): CommonDataGridColumnConfig<StudentDocument>[] => {
    return [
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.STUDENT_DOCUMENT_ID,
        field: 'studentDocumentId',
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

  private onDeleteClick = (row: StudentDocument): void => {
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
        const isNew = CommonHelper.isEmpty(row.studentDocumentId) || !row.documentPath;
        const items = this.studentDocumentStore.data() || [];
        let updatedList;
        if (isNew) {
          updatedList = items.filter((item) => item !== row);
        } else {
          updatedList = items.map((item) =>
            item.studentDocumentId === row.studentDocumentId ? { ...item, isDeleted: true, isActive: false } : item
          );
        }
        this.studentDocumentStore.setData(updatedList);
      });
  };

  onSave = (): void => {
    if (!this.isUpdated() || CommonHelper.isEmpty(this.studentId())) return;
    const items = this.studentDocumentStore.data() || [];
    const payload = items.map(item => ({
      ...item,
      studentId: this.studentId(),
      documentName: item.documentName?.trim()
        || FileHelper.getFileNameFromPath(item.documentPath)
        || item.documentTypeName
        || '',
    }));
    this.studentDocumentStore.create({
      endpoint: API.ADMIN.USER.STUDENT.ADDUPDATESTUDENTDOCUMENT,
      body: payload as unknown as StudentDocument[],
    });
  };

  onAddClick = (): void => {
    if (CommonHelper.isEmpty(this.studentId())) return;
    const availableOptions = this.availableDocumentTypeOptions();
    if (!availableOptions.length) {
      const allOptions = this.documentTypeOptions();
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
      component: AddStudentDocumentDialog,
      data: { documentTypes: availableOptions },
    }).afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((result: AddStudentDocumentDialogResult | null | undefined) => {
        if (!result) return;
        this.isUpdated.set(true);
        this.addDocumentRow(result);
      });
  };

  private addDocumentRow = (result: AddStudentDocumentDialogResult): void => {
    const updatedList = [
      ...(this.studentDocumentStore.data() || []),
      {
        studentDocumentId: EMPTY_GUID,
        studentId: this.studentId(),
        documentTypeId: result.documentTypeId,
        documentTypeName: result.documentTypeName,
        documentName: result.documentName,
        document: result.document,
        documentPath: null,
        isActive: true,
        isDeleted: false,
      },
    ];
    this.studentDocumentStore.setData(updatedList);
  };

  private onDownloadClick = (row: StudentDocument): void => {
    this.requestDocumentAction(row, 'download');
  };

  private onViewClick = (row: StudentDocument): void => {
    this.requestDocumentAction(row, 'view');
  };

  private hasDocumentPath = (row: StudentDocument): boolean => {
    return !!row.documentPath?.trim();
  };

  private hasLocalDocument = (row: StudentDocument): boolean => {
    return !!FileHelper.normalizeBase64(row.document);
  };

  private requestDocumentAction = (row: StudentDocument, mode: 'download' | 'view'): void => {
    if (row.isDeleted) return;

    const localDocumentBase64 = FileHelper.normalizeBase64(row.document);
    if (localDocumentBase64) {
      this.handleDocumentAction(row, mode, row.document);
      return;
    }

    if (!this.hasDocumentPath(row) || CommonHelper.isEmpty(row.studentDocumentId)) return;

    this.pendingDocumentAction.set({ row, mode });
    this.studentDocumentBase64Store.resetState();
    this.studentDocumentBase64Store.getById({
      endpoint: API.ADMIN.USER.STUDENT.GETSTUDENTDOCUMENTBASE64,
      params: { studentDocumentId: row.studentDocumentId },
    });
  };

  private handleDocumentAction = (
    row: StudentDocument,
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

  private resolveFileName = (row: StudentDocument, mimeType: string | null): string => {
    const pathFileName = FileHelper.getFileNameFromPath(row.documentPath);
    if (pathFileName) return pathFileName;

    const baseName = (row.documentTypeName || 'document').trim().replace(/\s+/g, '_');
    const extension = FileHelper.getFileExtensionFromMimeType(mimeType);
    return `${baseName}_${row.studentDocumentId}${extension}`;
  };
}

