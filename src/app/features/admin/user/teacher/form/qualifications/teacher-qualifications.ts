import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../../core/helpers/common-helper';
import { CommonHelperService } from '../../../../../../core/services/common-helper.service';
import { CommonButtonConfig } from '../../../../../../shared/components/button/model/button.model';
import { CommonDataGridComponent } from '../../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGrid, CommonDataGridColumnConfig } from '../../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../../shared/constants/api-url';
import { buildGridToolbarButton } from '../../../../../../shared/helpers/grid.helper';
import { GenericDialogService } from '../../../../../../shared/services/generic-dialog.service';
import { AddEditTeacherQualificationDialogData, TeacherQualification, TeacherQualificationGridRow, teacherQualificationsStore } from '../../models/teacher.model';
import { AddEditQualificationsDialog } from './add-edit-qualifications-dialog/add-edit-qualifications-dialog';
import { CommonDataGridFieldDataType } from '../../../../../../shared/components/common-data-grid/enums/grid.enum';
import { ConfirmationService } from '../../../../../../shared/services/dialog.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
@UntilDestroy()
@Component({
  selector: 'app-teacher-qualifications',
  imports: [CommonModule, CommonDataGridComponent],
  providers: [teacherQualificationsStore],
  templateUrl: './teacher-qualifications.html',
})
export class TeacherQualifications implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly genericDialog = inject(GenericDialogService);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly confirmService = inject(ConfirmationService);
  readonly qualificationsStore = inject(teacherQualificationsStore);

  private readonly isLoadRequested = signal(false);
  private readonly rowSeed = signal(1);
  private readonly teacherId = computed<string | null>(() => this.route.snapshot.paramMap.get('teacherId'));

  readonly rows = signal<TeacherQualificationGridRow[]>([]);
  readonly canPersist = computed(() => !CommonHelper.isEmpty(this.teacherId()));
  readonly hasQualifications = computed(() => this.rows().length > 0);
  readonly isUpdated = signal(false);

  qualificationsGridConfig!: CommonDataGrid<TeacherQualificationGridRow>;

  readonly addBtn = signal<CommonButtonConfig>(buildGridToolbarButton({
    tooltipText: this.commonHelperService.handleButtonText(SYSTEM_CONST.LABELS.QUALIFICATION.QUALIFICATION),
    icon: 'add_2',
    callback: () => this.onAddClick(),
    disableCallBack: () => !this.canPersist(),
    isPrimary: true
  }));

  constructor() {
    effect(() => {
      if (!this.isLoadRequested()) return;
      if (this.qualificationsStore.isLoading()) return;

      const data = this.qualificationsStore.data();
      const items = CommonHelper.isNotEmptyArray(data) ? data : [];
      this.rows.set(items.map((item) => this.toGridRow(item)));
      this.isUpdated.set(false);
      this.isLoadRequested.set(false);
    });
  }

  ngOnInit(): void {
    this.qualificationsStore.resetState();
    this.qualificationsGridConfig = this.buildGridConfig();
  }

  onSave = (): void => {
    if (!this.isUpdated() || !this.canPersist()) return;

    const payload = this.buildSavePayload(this.teacherId());
    this.qualificationsStore.create({
      endpoint: API.ADMIN.USER.TEACHER.ADD_UPDATE_QUALIFICATIONS,
      body: payload as any,
    });
  };

  hasChanges = (): boolean => {
    return this.isUpdated();
  };

  private loadQualifications = (): void => {
    if (!this.canPersist()) {
      this.rows.set([]);
      return;
    }

    this.isLoadRequested.set(true);
    
    this.qualificationsStore.getById({
      endpoint: API.ADMIN.USER.TEACHER.GET_QUALIFICATIONS,
      params: { teacherId: this.teacherId() }
    });
  };

  private buildGridConfig = (): CommonDataGrid<TeacherQualificationGridRow> => {
    return {
      id: 'admin-teacher-qualifications-grid',
      primaryKey: 'rowKey',
      columns: this.buildColumns(),
      actionButtons: [
        {
          buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
          matIconName: 'edit',
          callback: this.onEditClick,
          disableCallback: (row: TeacherQualificationGridRow) => row.isActive === false,
        },
        {
          buttonText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
          matIconName: 'delete',
          callback: this.onDeleteClick,
          disableCallback: (row: TeacherQualificationGridRow) => row.isActive === false,
        },
      ],
      signalStore: {
        load: () => this.loadQualifications(),
        list: () => this.rows(),
        recordsFiltered: () => this.rows().length,
        isLoading: () => this.isLoadRequested() || this.qualificationsStore.isLoading(),
      },
      addButton: this.addBtn()
    };
  };

  private buildColumns = (): CommonDataGridColumnConfig<TeacherQualificationGridRow>[] => {
    return [
      {
        title: SYSTEM_CONST.LABELS.QUALIFICATION.QUALIFICATION,
        field: 'qualification',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.QUALIFICATION.PASSING_YEAR,
        field: 'passingYear',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.QUALIFICATION.INSTITUTION,
        field: 'institutionName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.QUALIFICATION.UNIVERSITY,
        field: 'universityName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.QUALIFICATION.IS_PERCENTAGE,
        field: 'isPercentage',
        fieldDataType: CommonDataGridFieldDataType.BooleanIcon
      },
      {
        title: SYSTEM_CONST.LABELS.QUALIFICATION.MARKS,
        field: 'marks',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true,
      },
    ];
  };

  private onAddClick = (): void => {
    this.openQualificationDialog({
      teacherId: this.teacherId(),
      qualification: null,
      onSave: (result) => {
        const nextRows = [...this.rows(), this.toGridRow({ ...result, isNew: true })];
        this.rows.set(nextRows);
        this.isUpdated.set(true);
      },
    });
  };

  private onEditClick = (row: TeacherQualificationGridRow): void => {
    this.openQualificationDialog({
      teacherId: this.teacherId(),
      qualification: row,
      onSave: (result) => {
        const nextRows = this.rows().map((item) => {
          if (item.rowKey !== row.rowKey) return item;
          return this.toGridRow(result, row.rowKey);
        });

        this.rows.set(nextRows);
        this.isUpdated.set(true);
      },
    });
  };

  private onDeleteClick = (row: TeacherQualificationGridRow): void => {
    if (row.isActive === false) return;

    this.confirmService.confirm({
      title: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
      message: SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.qualification ?? ''),
      confirmText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
      cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
    })
      .pipe(untilDestroyed(this))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        const isNew = !!row.isNew;
        if (isNew) {
          const nextRows = this.rows().filter((item) => item.rowKey !== row.rowKey);
          this.rows.set(nextRows);
        } else {
          const nextRows = this.rows().map((item) => {
            if (item.rowKey !== row.rowKey) return item;
            return { ...item, isActive: false };
          });
          this.rows.set(nextRows);
        }
        this.isUpdated.set(true);
      });
  };

  private openQualificationDialog = (data: AddEditTeacherQualificationDialogData): void => {
    const isEditMode = !CommonHelper.isEmpty(data.qualification?.teacherQualificationId);
    this.genericDialog.open({
      width: '55vw',
      disableClose: true,
      title: `${isEditMode ? SYSTEM_CONST.ACTION_BUTTONS.EDIT : SYSTEM_CONST.ACTION_BUTTONS.ADD} Qualification`,
      component: AddEditQualificationsDialog,
      data,
    });
  };

  private toGridRow = (item: TeacherQualification, rowKey?: string): TeacherQualificationGridRow => ({
    ...item,
    rowKey: rowKey ?? this.resolveRowKey(item),
    isActive: item.isActive ?? true,
    isNew: !!item.isNew || CommonHelper.isEmpty(item.teacherQualificationId),
    teacherId: CommonHelper.resolveId(item.teacherId ?? this.teacherId()),
    teacherQualificationId: CommonHelper.resolveId(item.teacherQualificationId),
  });

  private toQualification = (item: TeacherQualificationGridRow): TeacherQualification => ({
    ...item,
    teacherQualificationId: CommonHelper.resolveId(item.teacherQualificationId),
    teacherId: CommonHelper.resolveId(item.teacherId ?? this.teacherId()),
    isActive: !!item.isActive,
  });

  private buildSavePayload = (teacherId: string | null): TeacherQualification[] => {
    return this.rows()
      .filter(row => row.isActive !== false)
      .map((row) => ({
        ...this.toQualification(row),
        teacherId,
      }));
  };

  private resolveRowKey = (item: TeacherQualification): string => {
    const id = item.teacherQualificationId;
    if (!CommonHelper.isEmpty(id)) return `qual-${id}`;

    const next = this.rowSeed();
    this.rowSeed.set(next + 1);
    return `local-${next}`;
  };
}
