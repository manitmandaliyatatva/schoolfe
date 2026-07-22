import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, Observable } from 'rxjs';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../../core/helpers/common-helper';
import { CommonHelperService } from '../../../../../../core/services/common-helper.service';
import { CommonDropdownStore } from '../../../../../../core/store/common-dropdown.store';
import { ButtonType } from '../../../../../../core/models/common.model';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../../shared/components/button/model/button.model';
import { CommonDataGridComponent } from '../../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGrid, CommonDataGridColumnConfig } from '../../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../../shared/constants/api-url';
import { GuardianSubTypeConst, GuardianTypeConst } from '../../../../../../shared/constants/guardian-type.constant';
import { UserTypeConst } from '../../../../../../shared/constants/user-type.constants';
import { getButtonConfig } from '../../../../../../shared/functions/config-function';
import { GenericDialogService } from '../../../../../../shared/services/generic-dialog.service';
import { AddEditGuardianDialogData, guardianStore, Guardian, GuardianConst, GuardianGridRow } from '../../models/guardian.model';
import { AddEditGuardianDialog } from './add-edit-guardian-dialog/add-edit-guardian-dialog';
import { StatusChipComponent } from '../../../../../../shared/components/status-chip/status-chip.component';

@Component({
  selector: 'app-guardian-details',
  imports: [CommonModule, CommonDataGridComponent, ButtonComponent, StatusChipComponent],
  providers: [guardianStore],
  templateUrl: './guardian-details.html',
})
export class GuardianDetails implements OnInit, OnDestroy {
  private static readonly DROPDOWN_KEYS = {
    roleType: 'guardianRoleType',
  } as const;

  private readonly route = inject(ActivatedRoute);
  private readonly genericDialog = inject(GenericDialogService);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly dropdownStore = inject(CommonDropdownStore);
  readonly guardianStore = inject(guardianStore);
  readonly roleTypeDropdownList = this.dropdownStore.getList(GuardianDetails.DROPDOWN_KEYS.roleType);

  private readonly studentId = signal<string | null>(null);
  private readonly isLoadRequested = signal(false);
  private readonly rowSeed = signal(1);

  readonly rows = signal<GuardianGridRow[]>([]);
  readonly canPersist = computed(() => !CommonHelper.isEmpty(this.studentId()));
  readonly hasGuardians = computed(() => this.rows().length > 0);
  readonly isUpdated = signal(false);

  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<unknown>;

  guardianGridConfig!: CommonDataGrid<GuardianGridRow>;

  readonly addBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(
      () => this.onAddClick(),
      'flat',
      'primary',
      this.commonHelperService.handleButtonText('Guardian'),
      true,
      () => this.rows().filter(r => !r.isDeleted).length >= 5
    ),
    cssClasses: ['configuration-add-btn'],
  });

  constructor() {
    effect(() => {
      if (!this.isLoadRequested()) return;
      if (this.guardianStore.isLoading()) return;

      const guardianRows = this.guardianStore.data() ?? [];
      this.rows.set(guardianRows.map((item) => this.toGridRow(item as Guardian)));
      this.isUpdated.set(false);
      this.isLoadRequested.set(false);
    });
  }

  ngOnInit(): void {
    this.guardianStore.resetState();
    this.studentId.set(this.resolveStudentId());
    this.guardianGridConfig = this.buildGridConfig();
    this.loadRoleTypeDropdown();
    this.loadGuardianDetails();
  }

  ngOnDestroy(): void {
    this.dropdownStore.resetState();
  }

  onSave = (): void => {
    if (!this.isUpdated() || !this.canPersist()) return;

    const payload = this.buildSavePayload(this.studentId());
    const isSaveClickedSignal = signal<boolean>(false);

    this.commonHelperService.saveWithEmailVerification({
      store: this.guardianStore,
      endpoint: API.ADMIN.USER.GUARDIAN.ADDUPDATE,
      payload,
      isSaveClickedSignal
    }).subscribe();
  };

  hasValidationError = (): boolean => {
    return !this.hasGuardians();
  };

  hasChanges = (): boolean => {
    return this.isUpdated();
  };

  addGuardianDetailsWithResult = (studentId: string): Observable<Guardian[] | null> => {
    if (CommonHelper.isEmpty(studentId)) {
      throw new Error(GuardianConst.INVALID_STUDENT_ID);
    }

    const payload = this.buildSavePayload(studentId);
    if (!payload.length) {
      return of(null);
    }

    this.studentId.set(studentId);
    const isSaveClickedSignal = signal<boolean>(false);

    return this.commonHelperService.saveWithEmailVerification({
      store: this.guardianStore,
      endpoint: API.ADMIN.USER.GUARDIAN.ADDUPDATE,
      payload,
      isSaveClickedSignal
    }) as Observable<Guardian[] | null>;
  };

  private resolveStudentId = (): string | null => {
    return this.route.snapshot.paramMap.get('studentId');
  };

  private loadGuardianDetails = (): void => {
    if (!this.canPersist()) {
      this.rows.set([]);
      return;
    }

    this.isLoadRequested.set(true);
    this.guardianStore.getById({
      endpoint: API.ADMIN.USER.GUARDIAN.GET,
      params: { studentId: this.studentId() },
    });
  };

  private buildGridConfig = (): CommonDataGrid<GuardianGridRow> => {
    return {
      id: 'admin-student-guardian-grid',
      primaryKey: 'rowKey',
      columns: this.buildColumns(),
      actionButtons: [
        {
          buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
          matIconName: 'edit',
          callback: this.onEditClick,
          disableCallback: (row: GuardianGridRow) => row.isDeleted,
        },
        {
          buttonText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
          matIconName: 'delete',
          callback: this.onDeleteClick,
          disableCallback: (row: GuardianGridRow) => row.isDeleted,
        },
      ],
      signalStore: {
        load: () => this.loadGuardianDetails(),
        list: () => this.rows(),
        recordsFiltered: () => this.rows().length,
        isLoading: () => this.isLoadRequested() || this.guardianStore.isLoading(),
      },
    };
  };

  private buildColumns = (): CommonDataGridColumnConfig<GuardianGridRow>[] => {
    return [
      {
        title: SYSTEM_CONST.LABELS.COMMON.FULL_NAME,
        field: 'fullName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.EMAIL,
        field: 'email',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.PHONE_NUMBER,
        field: 'phoneNumber',
        fieldDataType: CommonDataGridFieldDataType.PhoneNumber,
      },
      {
        title: SYSTEM_CONST.LABELS.USER.GUARDIAN_TYPE,
        field: 'guardianTypeName',
      },
      {
        title: SYSTEM_CONST.LABELS.USER.GUARDIAN_SUB_TYPE,
        field: 'guardianSubTypeName',
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.statusTemplate,
      },
    ];
  };

  private onAddClick = (): void => {
    this.openGuardianDialog({
      studentId: this.studentId(),
      guardian: null,
      existingGuardians: this.rows(),
      onSave: (result) => {
        const nextRows = [...this.rows(), this.toGridRow({ ...result, isNew: true })];
        this.rows.set(nextRows);
        this.isUpdated.set(true);
      },
    });
  };

  private onEditClick = (row: GuardianGridRow): void => {
    this.openGuardianDialog({
      studentId: this.studentId(),
      guardian: row,
      existingGuardians: this.rows(),
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

  private onDeleteClick = (row: GuardianGridRow): void => {
    if (row.isDeleted) return;

    this.commonHelperService.confirmAndCallApi({
      title: this.commonHelperService.handleButtonText(SYSTEM_CONST.LABELS.USER.GUARDIAN, ButtonType.Delete),
      message: SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.fullName ?? ''),
      confirmText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
      request: () => {
        const isNew = !!row.isNew;
        if (isNew) {
          const nextRows = this.rows().filter((item) => item.rowKey !== row.rowKey);
          this.rows.set(nextRows);
        } else {
          const nextRows = this.rows().map((item) => {
            if (item.rowKey !== row.rowKey) return item;
            return { ...item, isDeleted: true, isActive: false };
          });
          this.rows.set(nextRows);
        }
        this.isUpdated.set(true);
      }
    });
  };

  private openGuardianDialog = (data: AddEditGuardianDialogData): void => {
    const isEditMode = !CommonHelper.isEmpty(data.guardian?.guardianId);
    this.genericDialog.open({
      width: '55vw',
      disableClose: true,
      title: `${isEditMode ? SYSTEM_CONST.ACTION_BUTTONS.EDIT : SYSTEM_CONST.ACTION_BUTTONS.ADD} Guardian`,
      component: AddEditGuardianDialog,
      data,
    });
  };

  private loadRoleTypeDropdown = (): void => {
    this.dropdownStore.getDropdown({
      key: GuardianDetails.DROPDOWN_KEYS.roleType,
      endpoint: API.ADMIN.USER.ROLE.ROLEBYUSERTYPE,
      params: { userTypeId: UserTypeConst.Parent },
    });
  };

  private toGridRow = (item: Guardian, rowKey?: string): GuardianGridRow => ({
    ...item,
    fullName: this.buildFullName(item),
    rowKey: rowKey ?? this.resolveRowKey(item),
    guardianTypeName: item.guardianTypeName || this.getEnumNameByValue(GuardianTypeConst, item.guardianType),
    guardianSubTypeName: item.guardianSubTypeName || this.getEnumNameByValue(GuardianSubTypeConst, item.guardianSubType),
    isActive: item.isActive ?? true,
    isActAsUser: item.isActAsUser ?? false,
    isDeleted: item.isDeleted ?? false,
    isNew: !!item.isNew || CommonHelper.isEmpty(item.guardianId),
    studentId: CommonHelper.resolveId(item.studentId ?? this.studentId()),
    guardianId: CommonHelper.resolveId(item.guardianId),
    guardianType: Number(item.guardianType ?? 0),
    guardianSubType: Number(item.guardianSubType ?? 0),
  });

  private toGuardian = (item: GuardianGridRow): Guardian => ({
    ...item,
    guardianId: CommonHelper.resolveId(item.guardianId),
    studentId: CommonHelper.resolveId(item.studentId ?? this.studentId()),
    fullName: this.buildFullName(item),
    guardianType: Number(item.guardianType ?? 0),
    guardianSubType: Number(item.guardianSubType ?? 0),
    isActAsUser: !!item.isActAsUser,
    isActive: !!item.isActive,
    isDeleted: !!item.isDeleted,
  });

  private buildSavePayload = (studentId: string | null): Guardian[] => {
    return this.rows().map((row) => ({
      ...this.toGuardian(row),
      studentId,
    }));
  };

  private resolveRowKey = (item: Guardian): string => {
    const guardianId = item.guardianId;
    if (!CommonHelper.isEmpty(guardianId)) return `guardian-${guardianId}`;

    const next = this.rowSeed();
    this.rowSeed.set(next + 1);
    return `local-${next}`;
  };

  private buildFullName = (item: Guardian): string => {
    return [item.firstName, item.middleName, item.lastName]
      .map((value) => (value ?? '').trim())
      .filter(Boolean)
      .join(' ');
  };

  private getEnumNameByValue = (enumObj: Record<string, number>, value: number | null | undefined): string => {
    const numericValue = Number(value ?? 0);
    const matched = Object.entries(enumObj).find(([, enumValue]) => enumValue === numericValue);
    return matched?.[0] ?? '-';
  };

}
