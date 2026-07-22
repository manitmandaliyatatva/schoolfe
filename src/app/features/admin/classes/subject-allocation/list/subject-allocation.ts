import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { SYSTEM_CONST } from "../../../../../core/constants/system.constant";
import { ButtonType } from "../../../../../core/models/common.model";
import { CommonHelperService } from "../../../../../core/services/common-helper.service";
import { CommonButtonConfig } from "../../../../../shared/components/button/model/button.model";
import { CommonDataGridComponent } from "../../../../../shared/components/common-data-grid/common-data-grid.component";
import { CommonDataGridFieldDataType } from "../../../../../shared/components/common-data-grid/enums/grid.enum";
import { CommonDataGrid, CommonDataGridActionButtonConfig, CommonDataGridColumnConfig, CommonDataGridFeatures, CommonDataGridFilter } from "../../../../../shared/components/common-data-grid/model/common-data-grid.model";
import { API } from "../../../../../shared/constants/api-url";
import { CLASS_ROUTE } from "../../../../../shared/constants/route.constant";
import { TITLES } from "../../../../../shared/constants/title.constant";
import { buildGridListRequest, buildGridToolbarButton } from "../../../../../shared/helpers/grid.helper";
import { ConfirmationService } from "../../../../../shared/services/dialog.service";
import { SubjectAllocationGridRow } from "../models/subject-allocation.model";
import { SubjectAllocationStore } from "../stores/subject-allocation.store";

@Component({
  selector: 'app-subject-allocation',
  imports: [CommonDataGridComponent],
  templateUrl: './subject-allocation.html',
  styleUrl: './subject-allocation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubjectAllocation {
  private readonly defaultPageSize = 10;
  private readonly externalSearchText = '';

  private readonly subjectAllocationStore = inject(SubjectAllocationStore);
  private readonly confirmService = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly isDeleteRequested = signal(false);
  private readonly commonService = inject(CommonHelperService);
  permission = computed(() => this.commonService.getPermissionByPage());

  constructor() {
    effect(() => {
      if (!this.isDeleteRequested() || !this.subjectAllocationStore.isSuccess()) return;
      this.isDeleteRequested.set(false);
      this.subjectAllocationStore.getAll({
        endpoint: API.CLASS.GET_CLASS_SUBJECT_LIST,
        body: buildGridListRequest(this.subjectAllocationGridConfig.gridFilter!),
      });
    });
  }

  readonly addButtonConfig: CommonButtonConfig = buildGridToolbarButton({
    tooltipText: this.commonService.handleButtonText(TITLES.SUBJECT_ALLOCATION),
    icon: 'add_2',
    callback: () => this.router.navigateByUrl(`/admin/class/${CLASS_ROUTE.SUBJECT_ALLOCATION_ADD}`),
    isPrimary: true
  });

  private readonly features: CommonDataGridFeatures = {
    showPagination: true,
    showSearch: true,
    searchPlaceholder: 'Search subject allocation...',
    paginatorFeatures: {
      defaultPagesize: this.defaultPageSize,
      pageSizeOptions: [10, 25, 50, 100],
      showFirstLastButton: true,
    },
    toolbar: {
      buttonConfig: this.permission().canCreate ? [this.addButtonConfig] : undefined,
    }
  };

  private readonly columns: CommonDataGridColumnConfig<SubjectAllocationGridRow>[] = [
    {
      title: SYSTEM_CONST.LABELS.ACADEMIC.CLASS,
      field: 'className',
      isSortable: true,
      fieldDataType: CommonDataGridFieldDataType.String,
    },
    {
      title: SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT,
      field: 'subjectName',
      isSortable: true,
      fieldDataType: CommonDataGridFieldDataType.String,
    },
    {
      title: SYSTEM_CONST.LABELS.COMMON.STATUS,
      field: 'isActive',
      isSortable: true,
      fieldDataType: CommonDataGridFieldDataType.Boolean,
    },
  ];

  private readonly actionButtons: CommonDataGridActionButtonConfig<SubjectAllocationGridRow>[] = [
    {
      matIconName: 'edit',
      buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
      tooltipText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
      callback: (row) => { this.router.navigate(['/admin/class/subject-allocation/edit', row.classSubjectId]) },
      visibleCallback: () => this.permission().canUpdate
    },
    {
      matIconName: 'delete',
      buttonText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
      tooltipText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
      callback: (row) => this.onDelete(row),
      visibleCallback: () => this.permission().canDelete
    },
  ];

  subjectAllocationGridConfig: CommonDataGrid<SubjectAllocationGridRow> = {
    id: 'subject-allocation-signal-grid',
    primaryKey: 'classSubjectId',
    features: this.features,
    columns: this.columns,
    actionButtons: this.permission().showGridAction ? this.actionButtons : undefined,
    gridFilter: {
      pageIndex: 0,
      pageSize: this.defaultPageSize,
      defaultSortingColumn: null,
      sortOrder: '',
      generalSearch: this.externalSearchText,
    },
    signalStore: {
      load: (filter: CommonDataGridFilter<SubjectAllocationGridRow>) =>
        this.subjectAllocationStore.getAll({
          endpoint: API.CLASS.GET_CLASS_SUBJECT_LIST,
          body: buildGridListRequest(filter),
        }),
      list: () => this.subjectAllocationStore.list(),
      recordsFiltered: () => this.subjectAllocationStore.totalRecords(),
      isLoading: () => this.subjectAllocationStore.isLoading(),
    },
  };

  private onDelete(row: SubjectAllocationGridRow): void {
    this.confirmService
      .confirm({
        title: this.commonService.handleButtonText(TITLES.SUBJECT_ALLOCATION, ButtonType.Delete),
        message: SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(`${row.className} - ${row.subjectName}`),
        confirmText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.isDeleteRequested.set(true);
        this.subjectAllocationStore.remove({
          endpoint: API.CLASS.DELETE_CLASS_SUBJECT,
          params: { classSubjectId: row.classSubjectId },
        });
      });
  }
}

