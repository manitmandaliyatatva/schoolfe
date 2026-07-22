import { Component, computed, effect, inject, OnDestroy, OnInit, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { SYSTEM_CONST } from '../../../core/constants/system.constant';
import { DEFAULT_GRID_STATE, GridState } from '../../../core/models/grid-state.model';
import { CommonHelperService } from '../../../core/services/common-helper.service';
import { GridStateStore } from '../../../core/store/grid-state.store';
import { AuthStore } from '../../../core/store/auth.store';
import CommonHelper from '../../../core/helpers/common-helper';
import { MANAGEMENT_TITLE } from '../../constants/title.constant';
import { buildGridListRequest, buildGridToolbarButton } from '../../helpers/grid.helper';
import { ConfirmationService } from '../../services/dialog.service';
import { CommonButtonConfig } from '../button/model/button.model';
import { CommonDataGrid, CommonDataGridActionButtonConfig, CommonDataGridCheckboxConfig, CommonDataGridColumnConfig, CommonDataGridStore, SelectionState } from '../common-data-grid/model/common-data-grid.model';
import { CommonDataGridSortDirection } from '../common-data-grid/types/grid.type';

@Component({
  template: ''
})
export abstract class GridBase<T extends { [key: string]: any }> implements OnInit, OnDestroy {
  protected readonly router = inject(Router);
  protected readonly confirmService = inject(ConfirmationService);
  protected readonly commonHelperService = inject(CommonHelperService);
  protected readonly gridStateStore = inject(GridStateStore);
  protected readonly _authStore = inject(AuthStore);

  protected abstract store: any;
  protected abstract apiEndpoint: string;
  protected abstract deleteEndpoint: string;
  protected abstract primaryKey: keyof T;
  protected abstract pageTitle: string;
  protected abstract routeBasePath: string;
  protected abstract deleteConfirmTitle: string;
  protected abstract deleteConfirmMessage: (row: T) => string;
  protected abstract buildColumns(): CommonDataGridColumnConfig<T>[];
  protected restrictToCurrentYearOnly = false;
  protected disableActionsInPastAcademicYear = false;
  protected allowEditOnPastYear = true;

  protected get isPastAcademicYear(): boolean {
    return CommonHelper.isPastAcademicYear(
      this._authStore.iscurrentacademicyear(),
      this._authStore.academicyearenddate()
    );
  }

  protected get isActionAllowed(): boolean {
    if (this.restrictToCurrentYearOnly) {
      return this._authStore.iscurrentacademicyear() !== false;
    }
    if (this.disableActionsInPastAcademicYear) {
      return !this.isPastAcademicYear;
    }
    return true;
  }

  protected isAddButton = () => {
    return this.isActionAllowed;
  };
  protected isAddButtonDisabled = () => false;
  protected defaultSortColumn: string | null = null;
  protected defaultSortOrder: CommonDataGridSortDirection = '';
  protected isPostMode: boolean = true;
  protected showAddButton = true;
  protected reloadListCallback = () => { };
  protected skipViewPermissionForEdit = false;

  isEditVisible = computed(() => this.permission().canUpdate && (this.allowEditOnPastYear || this.isActionAllowed));

  protected get pageKey(): string {
    return this.routeBasePath;
  }

  onAddClick = (): void => {
    this.router.navigate([...this.routeBasePath.split('/'), 'add']);
  }

  onEditClick = (row: T): void => {
    // Guard: must have canView before entering the edit page
    if (!this.permission().canView && !this.permission().canUpdate) return;
    this.router.navigate([...this.routeBasePath.split('/'), 'edit', row[this.primaryKey]]);
  }

  onDeleteClick = (row: T): void => {
    this.confirmService
      .confirm({
        title: this.deleteConfirmTitle,
        message: this.deleteConfirmMessage(row),
        confirmText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.isDeleteRequested.set(true);
        this.store.remove({
          endpoint: this.deleteEndpoint,
          params: { [this.primaryKey as string]: row[this.primaryKey] },
        });
      });
  }

  protected get baseActionButtons(): CommonDataGridActionButtonConfig<T>[] {
    return [
      {
        matIconName: 'edit',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
        callback: this.onEditClick,
        visibleCallback: () => this.skipViewPermissionForEdit ? this.isEditVisible() : (this.isEditVisible() || this.permission().canView),
      },
      {
        matIconName: 'delete',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        callback: this.onDeleteClick,
        visibleCallback: () => this.permission().canDelete && this.isActionAllowed,
      },
    ];
  }

  protected get extraActionButtons(): CommonDataGridActionButtonConfig<T>[] {
    return [];
  }

  protected get actionButtons(): CommonDataGridActionButtonConfig<T>[] {
    return [...this.baseActionButtons, ...this.extraActionButtons].filter(btn => {
      if (!btn.visibleCallback) return true;
      try {
        // Try calling the visibleCallback with undefined to check for static permission-based visibility.
        // If it returns false, the button is statically hidden for this user/page.
        // If it throws, it likely depends on row data, so we keep it to be safe.
        return btn.visibleCallback(undefined as any);
      } catch {
        return true;
      }
    });
  }

  protected gridConfig!: CommonDataGrid<T>;
  screenTitle = signal('');
  addBtnConfig = signal<CommonButtonConfig | null>(null);
  permission = computed(() => this.commonHelperService.getPermissionByPage());

  private readonly isDeleteRequested = signal(false);
  protected currentGridState = signal<GridState>({ ...DEFAULT_GRID_STATE });
  private isInitialized = false;

  constructor() {
    effect(() => {
      if (!this.isDeleteRequested() || !this.store.isSuccess()) return;
      this.isDeleteRequested.set(false);
      this.reloadList();
      this.reloadListCallback();
    });

    // Rebuild gridConfig whenever the academic year changes so that
    // actionButtons (which depend on isActionAllowed) are re-evaluated.
    effect(() => {
      this._authStore.iscurrentacademicyear(); // track the signal
      if (this.isInitialized) {
        untracked(() => {
          this.gridConfig = this.buildGridConfig();
        });
      }
    });
  }

  ngOnInit(): void {
    this.store.resetState();
    this.screenTitle.set(`${this.pageTitle} ${MANAGEMENT_TITLE}`);

    this.addBtnConfig.set(buildGridToolbarButton({
      icon: 'add_2',
      tooltipText: this.commonHelperService.handleButtonText(this.pageTitle),
      isPrimary: true,
      callback: this.onAddClick,
      isBtnVisible : () => this.isAddButton(),
      disableCallBack: () => this.isAddButtonDisabled()
    }))

    const savedState = this.gridStateStore.getState(this.pageKey);
    const hasValidSortOrder = savedState.sortOrder === 'asc' || savedState.sortOrder === 'desc';
    const hasSortColumn = !!savedState.sortColumn;

    if (!hasSortColumn && this.defaultSortColumn) {
      savedState.sortColumn = this.defaultSortColumn;
      savedState.sortOrder = this.defaultSortOrder === 'desc' ? 'desc' : 'asc';
    } else if (hasSortColumn && !hasValidSortOrder) {
      const isDefaultSortColumn = savedState.sortColumn === this.defaultSortColumn;
      const fallbackOrder = isDefaultSortColumn ? this.defaultSortOrder : 'asc';
      savedState.sortOrder = fallbackOrder === 'desc' ? 'desc' : 'asc';
    }

    this.currentGridState.set(savedState);

    this.gridConfig = this.buildGridConfig();
    this.isInitialized = true;
  }

  protected onGridStateChange = (filter: any): void => {
    const state: GridState = {
      ...this.currentGridState(),
      pageIndex: filter.pageIndex ?? 0,
      pageSize: filter.pageSize ?? 10,
      sortColumn: filter.defaultSortingColumn ?? null,
      sortOrder: filter.sortOrder ?? '',
      generalSearch: filter.generalSearch ?? '',
      extraFilters: filter.filterData ?? null,
    };
    this.currentGridState.set(state);
    this.gridStateStore.setState(this.pageKey, state);
  }

  protected checkboxConfig(): CommonDataGridCheckboxConfig<T> | undefined {
    return undefined;
  }

  protected signalStore = (): CommonDataGridStore<T> => {
    return {
      ...this.store,
      load: (filter: any) => {
        this.onGridStateChange(filter);
        return this.store.getAll({
          endpoint: this.apiEndpoint,
          body: this.isPostMode ? buildGridListRequest(filter) : false,
        });
      },
    }
  }

  readonly selectedRows = signal<{
    included: T[];
    excluded: T[];
    state: SelectionState;
    count: number;
  } | null>(null);

  protected resetGridState(): void {
    this.gridStateStore.resetState(this.pageKey);
    this.currentGridState.set({ ...DEFAULT_GRID_STATE });
  }

  reloadList = (): void => {
    const state = this.currentGridState();
    this.store.getAll({
      endpoint: this.apiEndpoint,
      body: buildGridListRequest<T>({
        pageIndex: state.pageIndex,
        pageSize: state.pageSize,
        defaultSortingColumn: state.sortColumn,
        sortOrder: state.sortOrder,
        generalSearch: state.generalSearch,
        filterData: state.extraFilters,
      }),
    });
  }

  protected buildGridConfig(): CommonDataGrid<T> {
    const checkboxConfig = this.checkboxConfig();
    const signalStore = this.signalStore();
    return {
      id: `${this.routeBasePath}-grid`,
      primaryKey: this.primaryKey as string,
      columns: this.buildColumns(),
      addButton: this.showAddButton && this.permission().canCreate ? this.addBtnConfig() ?? undefined : undefined,
      actionButtons: this.permission().showGridAction ? this.actionButtons : [],
      initialState: this.currentGridState(),
      gridFilter: {
        defaultSortingColumn: this.defaultSortColumn,
        sortOrder: this.defaultSortOrder,
        pageIndex: 0,
        pageSize: this.currentGridState().pageSize,
        generalSearch: '',
        filterData: {},
      },
      ...(checkboxConfig && {
        checkboxConfig: {
          ...checkboxConfig,
          getSelectedRows: (included, excluded, state, count) => {
            this.selectedRows.set({ included, excluded, state, count });
            checkboxConfig.getSelectedRows?.(included, excluded, state, count);
          },
        },
      }),
      signalStore: signalStore
    };
  };

  ngOnDestroy(): void {
    this.store.resetState();
  }
}
