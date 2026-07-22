import { CommonModule, DatePipe } from '@angular/common';
import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, inject, input,
  OnInit, signal, untracked, ViewChild, output,
} from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox, MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonDateFormat } from '../../../core/constants/date-format.constant';
import { SYSTEM_CONST } from '../../../core/constants/system.constant';
import CommonHelper from '../../../core/helpers/common-helper';
import { generateGUID } from '../../../core/helpers/form-utils';
import { buildGridToolbarButton } from '../../helpers/grid.helper';
import { ITextValueOption } from '../../models/common.model';
import { DynamicFormControlType } from '../../models/form-control-base.model';
import { ContactFormatPipe } from '../../pipes/contact-format.pipe';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { BooleanStatusComponent } from '../boolean-status/boolean-status.component';
import { ButtonComponent } from '../button/button.component';
import { CommonButtonConfig } from '../button/model/button.model';
import { CommonDateRangeConfig } from '../common-daterange/model/common-daterange.model';
import { DynamicFormControl } from '../dynamic-form/model/dynamic-form.model';
import { FilterDrawerComponent } from '../filter-drawer/filter-drawer.component';
import { StatusChipComponent } from '../status-chip/status-chip.component';
import {
  DEFAULT_GRID_PAGE_INDEX,
  DEFAULT_GRID_PAGE_SIZE,
  DEFAULT_GRID_PAGE_SIZE_OPTIONS,
  DEFAULT_SEARCH_DEBOUNCE_TIME,
  GRID_TEMPLATE_KEYS,
} from './constants/grid.constant';
import { CommonDataGridFieldDataType, CommonDataGridFieldType } from './enums/grid.enum';
import {
  CommonDataGrid, CommonDataGridActionButtonConfig, CommonDataGridColumnConfig, CommonDataGridFeatures,
  CommonDataGridFilter, CommonDataGridFilterChip, CommonDataGridFilterFeature,
  CommonDataGridPaginatorFeatures, SelectionState
} from './model/common-data-grid.model';
import { CommonDataGridSortDirection } from './types/grid.type';

@Component({
  selector: 'common-data-grid',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatTooltipModule, MatSelectModule,
    MatInputModule, MatCheckboxModule, MatMenuModule, StatusChipComponent, BooleanStatusComponent,
    ButtonComponent, ButtonComponent, FilterDrawerComponent, DragDropModule
  ],
  providers: [DatePipe, ContactFormatPipe, CurrencyFormatPipe],
  templateUrl: './common-data-grid.component.html',
  styleUrl: './common-data-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonDataGridComponent<T> implements OnInit, AfterViewInit {
  protected readonly SYSTEM_CONST = SYSTEM_CONST;
  readonly config = input.required<CommonDataGrid<T>>();
  readonly rowDropped = output<{ previousIndex: number; currentIndex: number }>();

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;
  @ViewChild('masterCheckbox') masterCheckbox!: MatCheckbox;

  readonly tableDataSource = signal<MatTableDataSource<T>>(
    new MatTableDataSource<T>([]),
    { equal: () => false }
  );
  masterCheckboxState = signal<SelectionState>('notSelected');
  includedData = signal<T[]>([]);
  excludedData = signal<T[]>([]);
  isMasterCheckboxClicked = signal<boolean>(false)
  selectedDataCount: number = 0;
  totalCount = signal<number>(null);

  get getExcludedCount(): number { return this.config()?.excludedDataCount ?? 0; }
  readonly isCheckboxEnabled = computed(
    () => !!this.config()?.checkboxConfig?.showCheckboxSelection
  );
  readonly isMasterCheckboxEnabled = computed(
    () => !!this.config()?.checkboxConfig?.showMasterCheckBox
  );


  readonly displayedColumns = signal<string[]>([]);
  readonly visibleColumns = signal<CommonDataGridColumnConfig<T>[]>([]);
  readonly totalRecords = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly gridId = signal<string>('');
  readonly currentSort = signal<Sort>({ active: '', direction: '' });
  readonly columnSortDirection = computed<Record<string, CommonDataGridSortDirection>>(() => {
    const sort = this.currentSort();
    if (!sort.active || (sort.direction !== 'asc' && sort.direction !== 'desc')) return {};
    return { [sort.active]: sort.direction };
  });

  readonly activeFilter = signal<CommonDataGridFilter<T>>({
    pageIndex: DEFAULT_GRID_PAGE_INDEX,
    pageSize: DEFAULT_GRID_PAGE_SIZE,
    defaultSortingColumn: null,
    sortOrder: '',
    generalSearch: '',
  });

  readonly searchText = computed(() => this.activeFilter().generalSearch ?? '');

  // ── Filter Sidebar Signals ──────────────────────────────────
  readonly filterForm = signal<FormGroup>(new FormGroup({}));
  readonly initialFilterFormValue = signal<Record<string, unknown>>({});
  readonly appliedFilterState = signal<Record<string, unknown>>({});
  readonly isFilterSidebarOpen = signal<boolean>(false);

  // ── Computed: Features ──────────────────────────────────────
  readonly featuresConfig = computed<CommonDataGridFeatures | null>(
    () => this.config()?.features ?? null
  );
  readonly filterFeatureConfig = computed<CommonDataGridFilterFeature<T> | null>(
    () => this.featuresConfig()?.filter ?? null
  );
  readonly toolbarButtons = computed(
    () => this.featuresConfig()?.toolbar?.buttonConfig ?? []
  );
  readonly hasToolbarButtons = computed(
    () => this.toolbarButtons().length > 0
  );
  readonly isFilterEnabled = computed(() => !!this.filterFeatureConfig()?.form);
  readonly isFilterToggleButtonVisible = computed(
    () => this.filterFeatureConfig()?.showToggleButton ?? this.isFilterEnabled()
  );
  readonly isRefreshButtonEnabled = computed(
    () => (this.featuresConfig()?.showRefreshButton ?? true) && this.isSignalStoreMode()
  );
  readonly refreshButtonConfig = computed<CommonButtonConfig>(() => (CommonHelper.getRefreshButtonConfig(
    () => this.refreshData()
  )));
  readonly filterTitle = computed(() => this.filterFeatureConfig()?.title ?? SYSTEM_CONST.ACTION_BUTTONS.FILTER);
  readonly filterToggleButtonText = computed(() => this.filterFeatureConfig()?.toggleButtonText ?? SYSTEM_CONST.ACTION_BUTTONS.FILTER);
  readonly filterToggleButtonConfig = computed<CommonButtonConfig>(() => (buildGridToolbarButton({
    icon: 'filter_alt',
    tooltipText: this.filterToggleButtonText(),
    callback: () => this.openFilterSidebar(),
    isPrimary: true
  })));
  readonly filterApplyButtonText = computed(() => this.filterFeatureConfig()?.applyButtonText ?? SYSTEM_CONST.ACTION_BUTTONS.APPLY);
  readonly filterResetButtonText = computed(() => this.filterFeatureConfig()?.resetButtonText ?? SYSTEM_CONST.ACTION_BUTTONS.RESET);
  readonly filterResetButtonConfig = computed<CommonButtonConfig>(() => ({
    variant: 'stroked',
    color: 'basic',
    buttonText: this.filterResetButtonText(),
    cssClasses: ['btn', 'secondary-btn', 'filter-footer-btn'],
    callback: () => this.resetFilters(),
  }));

  readonly filterApplyButtonConfig = computed<CommonButtonConfig>(() => ({
    variant: 'flat',
    color: 'primary',
    buttonText: this.filterApplyButtonText(),
    cssClasses: ['btn', 'primary-btn', 'filter-footer-btn'],
    disableCallBack: () => this.filterForm().invalid,
    callback: () => this.applyFilters(),
  }));

  readonly canClearAllFilterChips = computed(
    () => this.filterFeatureConfig()?.chipConfig?.allowClearAll ?? true
  );
  readonly appliedFilterChips = computed<CommonDataGridFilterChip[]>(() => {
    this.config();
    this.filterFeatureConfig();
    return this.buildFilterChips(this.appliedFilterState());
  });
  readonly hasAppliedFilterChips = computed(() => this.appliedFilterChips().length > 0);

  // ── Computed: Pagination / Grid ─────────────────────────────
  readonly isPaginationDisplayed = computed(
    () => this.featuresConfig()?.showPagination ?? true
  );
  readonly isHeaderRowDisplayed = computed(
    () => !this.featuresConfig()?.hideHeaderRow
  );
  readonly isSearchEnabled = computed(
    () => this.featuresConfig()?.showSearch ?? true
  );
  readonly hasConfiguredSearchText = computed(
    () => !CommonHelper.isEmpty(this.config()?.gridFilter?.generalSearch)
  );
  readonly isSearchApplicable = computed(
    () => this.isSearchEnabled() || this.hasConfiguredSearchText()
  );
  readonly searchPlaceholder = computed(
    () => this.featuresConfig()?.searchPlaceholder ?? 'Search'
  );
  readonly addButtonConfig = computed<CommonButtonConfig | null>(
    () => this.config()?.addButton ?? null
  );
  readonly hasAddButton = computed(
    () => !!this.addButtonConfig()
  );
  readonly hasActionButtons = computed(
    () => CommonHelper.isNotEmptyArray(this.config()?.actionButtons)
  );
  readonly paginationFeatures = computed<CommonDataGridPaginatorFeatures | null>(
    () => this.featuresConfig()?.paginatorFeatures ?? null
  );
  readonly showFirstLastButtons = computed(
    () => this.paginationFeatures()?.showFirstLastButton ?? true
  );
  readonly fullWidthRowTemplate = computed(
    () => this.config()?.customRenderTemplateCallback?.(GRID_TEMPLATE_KEYS.FullWidthRow) ?? null
  );
  readonly mergeColumnSpan = computed(
    () => this.featuresConfig()?.mergeColumnSpan ?? this.displayedColumns().length
  );

  isFullWidthRow = (index: number, row: T): boolean => {
    return !!this.featuresConfig()?.isMergeColumn?.(row);
  };

  isRegularRow = (index: number, row: T): boolean => {
    return !this.isFullWidthRow(index, row);
  };
  readonly pageSize = computed(
    () => this.paginationFeatures()?.defaultPagesize ?? DEFAULT_GRID_PAGE_SIZE
  );
  readonly pageSizeOptions = computed(
    () => this.paginationFeatures()?.pageSizeOptions ?? DEFAULT_GRID_PAGE_SIZE_OPTIONS
  );
  readonly totalPages = computed(() => {
    const size = Math.max(1, this.activeFilter().pageSize || DEFAULT_GRID_PAGE_SIZE);
    const total = this.totalRecords();
    return Math.max(1, Math.ceil(total / size));
  });
  readonly pagedData = computed(() => {
    const ds = this.tableDataSource();
    if (this.isSignalStoreMode()) {
      return ds.data;
    }

    const activeFilter = this.activeFilter();
    const data = ds.filteredData || ds.data || [];
    if (!this.isPaginationDisplayed()) {
      return data;
    }

    const size = activeFilter.pageSize || DEFAULT_GRID_PAGE_SIZE;
    const index = Math.max(activeFilter.pageIndex ?? DEFAULT_GRID_PAGE_INDEX, 0);
    const start = index * size;
    return data.slice(start, start + size);
  });
  readonly currentpageIndex = computed(() => this.getCurrentPageIndex() + 1);
  readonly canGoPrevious = computed(() => this.getCurrentPageIndex() > 0);
  readonly canGoNext = computed(() => this.getCurrentPageIndex() < this.totalPages() - 1);
  readonly currentRangeLabel = computed(() => {
    const total = this.totalRecords();
    if (total <= 0) return '0 of 0';

    const size = Math.max(1, this.getPageSize());
    const start = this.getCurrentPageIndex() * size + 1;
    const end = Math.min(total, start + size - 1);
    return `${start}-${end} of ${total}`;
  });

  private readonly actionColumnKey = '__actions';
  private readonly isSignalStoreMode = signal<boolean>(false);
  private readonly viewInitialized = signal<boolean>(false);
  private readonly lastRequestedFilterKey = signal<string>('');

  private readonly datePipe = inject(DatePipe);
  private readonly contactFormatPipe = inject(ContactFormatPipe);
  private readonly currencyFormatPipe = inject(CurrencyFormatPipe);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly isGridInitialized = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (!this.config()) return;
      untracked(() => this.initializeGrid());
    });

    effect((onCleanup) => {
      const searchValue = this.searchText();
      const debounceMs = this.featuresConfig()?.searchDebounceMs ?? DEFAULT_SEARCH_DEBOUNCE_TIME;

      const timer = setTimeout(() => {
        if (!this.isGridInitialized()) return;
        this.patchFilter({ pageIndex: DEFAULT_GRID_PAGE_INDEX });
        if (this.paginator) this.paginator.firstPage();

        if (this.isSignalStoreMode()) {
          this.requestServerData();
          return;
        }

        this.updateDataSource((ds) => { ds.filter = searchValue; });
        this.totalRecords.set(this.tableDataSource().filteredData.length);
        this.cdr.markForCheck();
      }, debounceMs);

      onCleanup(() => clearTimeout(timer));
    });

    effect(() => {
      const store = this.config()?.signalStore;
      if (!this.isSignalStoreMode() || !store) return;

      const rows = store.list();
      const totalRecords = store.recordsFiltered();
      const loading = store.isLoading();

      untracked(() => this.applySignalStoreState(rows, totalRecords, loading));
    });
  }

  ngOnInit(): void {
    this.gridId.set(this.config()?.id ?? generateGUID('data-grid'));
    this.config()?.checkboxConfig?.showCheckboxSelection && this.resetMasterCheckBox();
  }

  ngAfterViewInit(): void {
    this.viewInitialized.set(true);
    this.attachClientSideMatFeatures();

    const filter = this.activeFilter();
    if (this.paginator) {
      this.paginator.pageIndex = filter.pageIndex ?? 0;
      this.paginator.pageSize = filter.pageSize ?? DEFAULT_GRID_PAGE_SIZE;
      this.cdr.markForCheck();
    }
  }

  getPageSize = (): number => this.activeFilter().pageSize;

  getCurrentPageIndex = (): number => Math.max(this.activeFilter().pageIndex ?? DEFAULT_GRID_PAGE_INDEX, 0);

  isActionButtonDisplayed = (button: CommonDataGridActionButtonConfig<T>, row: T): boolean =>
    button.visibleCallback ? button.visibleCallback(row) : true;

  isActionButtonDisabled = (button: CommonDataGridActionButtonConfig<T>, row: T): boolean =>
    button.disableCallback ? button.disableCallback(row) : false;

  getColumnWidth = (column: CommonDataGridColumnConfig<T>): string | undefined => {
    const width = column.style?.width;
    if (width === undefined || width === null) return undefined;
    return typeof width === 'number' ? `${width}px` : width;
  };

  getCellValue = (row: T, column: CommonDataGridColumnConfig<T>): unknown =>
    this.resolveValueByPath(row, String(column.field));

  getColumnKey = (column: CommonDataGridColumnConfig<T>): string => String(column.field);

  isLinkColumn = (column: CommonDataGridColumnConfig<T>, row?: T): boolean => {
    if (column.fieldType !== CommonDataGridFieldType.Link) return false;
    if (row && column.hasPermission !== undefined) {
      return typeof column.hasPermission === 'function' ? column.hasPermission(row) : column.hasPermission;
    }
    if (!row && column.hasPermission !== undefined && typeof column.hasPermission === 'boolean') {
      return column.hasPermission;
    }
    return true;
  };

  isStatusActive = (row: T, column: CommonDataGridColumnConfig<T>): boolean => {
    if (column.statusConfig?.value) {
      return column.statusConfig.value(row);
    }

    const value = this.getCellValue(row, column);
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true'
        || normalized === '1'
        || normalized === 'yes'
        || normalized === 'active';
    }
    return !!value;
  };

  isDefaultStatusColumn = (column: CommonDataGridColumnConfig<T>): boolean =>
    (this.isIsActiveField(column) || !!column.statusConfig) && !column.customRenderCell;

  isStatusHidden = (row: T, column: CommonDataGridColumnConfig<T>): boolean => {
    return column.statusConfig?.isHidden?.(row) ?? false;
  };

  isCustomTemplateColumn = (column: CommonDataGridColumnConfig<T>): boolean =>
    column.fieldDataType === CommonDataGridFieldDataType.CustomRenderTemplate
    && !!column.customRenderCell;

  isEditableColumn = (column: CommonDataGridColumnConfig<T>): boolean =>
    !!column.editConfig?.isEditable;

  isCheckboxEdit = (column: CommonDataGridColumnConfig<T>): boolean =>
    column.editConfig?.controlType === 'checkbox';

  isNumberEdit = (column: CommonDataGridColumnConfig<T>): boolean =>
    column.editConfig?.controlType === 'number';

  isBooleanIconColumn = (column: CommonDataGridColumnConfig<T>): boolean =>
    column.fieldDataType === CommonDataGridFieldDataType.BooleanIcon;

  isCurrencyColumn = (column: CommonDataGridColumnConfig<T>): boolean =>
    column.fieldDataType === CommonDataGridFieldDataType.Currency;

  onCellClick = (column: CommonDataGridColumnConfig<T>, row: T): void => {
    if (column.fieldType === CommonDataGridFieldType.Link && !this.isLinkColumn(column, row)) {
      return;
    }
    column.callback?.(row);
  };

  onRowDropped(event: CdkDragDrop<T[]>): void {
    this.rowDropped.emit({
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex
    });
  }

  onSortChange = (sort: Sort): void => {
    this.currentSort.set(sort);
    if (!this.isSignalStoreMode()) return;
    this.patchFilter({
      pageIndex: DEFAULT_GRID_PAGE_INDEX,
      defaultSortingColumn: sort.direction ? (this.config()?.columns.find((c) => c.field === sort.active)?.field ?? null) : null,
      sortOrder: (sort.direction ?? '') as CommonDataGridSortDirection,
    });
    this.requestServerData();
  };

  onPageChange = (event: PageEvent): void => {
    const pageSizeChanged = event.pageSize !== this.activeFilter().pageSize;

    if (this.isSignalStoreMode()) {
      if (pageSizeChanged) {
        const totalPages = Math.max(1, Math.ceil(this.totalRecords() / event.pageSize));
        const clampedIndex = Math.min(event.pageIndex, totalPages - 1);
        this.patchFilter({ pageIndex: clampedIndex, pageSize: event.pageSize });
      } else {
        this.patchFilter({ pageIndex: event.pageIndex, pageSize: event.pageSize });
      }
      this.requestServerData();
      return;
    }

    if (this.paginator) {
      this.paginator.pageIndex = event.pageIndex;
      this.paginator.pageSize = event.pageSize;
    }

    this.applyClientPaging();
  };

  goToFirstPage = (): void => {
    if (!this.showFirstLastButtons()) return;
    this.goToPage(DEFAULT_GRID_PAGE_INDEX);
  };

  goToPreviousPage = (): void => {
    if (!this.canGoPrevious()) return;
    this.goToPage(this.getCurrentPageIndex() - 1);
  };

  goToNextPage = (): void => {
    if (!this.canGoNext()) return;
    this.goToPage(this.getCurrentPageIndex() + 1);
  };

  goToLastPage = (): void => {
    if (!this.showFirstLastButtons()) return;
    this.goToPage(this.totalPages() - 1);
  };

  onPageSizeSelect = (value: string | number): void => {
    const nextPageSize = Number(value);
    if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) return;

    const currentPageIndex = this.getCurrentPageIndex();
    const totalPagesForSize = Math.max(1, Math.ceil(this.totalRecords() / nextPageSize));
    const nextPageIndex = Math.min(currentPageIndex, totalPagesForSize - 1);

    const pageEvent: PageEvent = {
      length: this.totalRecords(),
      pageIndex: nextPageIndex,
      pageSize: nextPageSize,
      previousPageIndex: currentPageIndex,
    };

    if (this.paginator) {
      this.paginator.pageIndex = nextPageIndex;
      this.paginator.pageSize = nextPageSize;
    }

    this.onPageChange(pageEvent);
    this.cdr.markForCheck();
  };

  onSearchTextChange = (value: string): void => {
    if (!this.isSearchEnabled()) return;
    const normalized = CommonHelper.normalizeString(value) ?? '';
    this.patchFilter({ generalSearch: normalized });
  };

  getDisplayValue = (row: T, column: CommonDataGridColumnConfig<T>): string => {
    const rawValue = this.getCellValue(row, column);
    if (rawValue === null || rawValue === undefined || rawValue === '') return '-';

    if (column.fieldDataType === CommonDataGridFieldDataType.Boolean)
      return rawValue ? 'Yes' : 'No';

    if (column.fieldDataType === CommonDataGridFieldDataType.Date)
      return this.datePipe.transform(rawValue as any, column.displayFormat ?? CommonDateFormat.DDMMYYYY_WithSlash)
        ?? String(rawValue);

    if (column.fieldDataType === CommonDataGridFieldDataType.Time)
      return CommonHelper.formatTimeAMPM(String(rawValue));

    if (column.fieldDataType === CommonDataGridFieldDataType.PhoneNumber)
      return this.contactFormatPipe.transform(String(rawValue));

    if (column.fieldDataType === CommonDataGridFieldDataType.Currency)
      return this.currencyFormatPipe.transform(rawValue as any);

    return String(rawValue);
  };

  onEditValueChange = (column: CommonDataGridColumnConfig<T>, row: T, value: unknown): void => {
    this.assignValueByPath(row as Record<string, unknown>, String(column.field), value);
    column.editConfig?.change?.(value, row);
  };

  onEditCheckboxChange = (column: CommonDataGridColumnConfig<T>, row: T, event: MatCheckboxChange): void => {
    this.assignValueByPath(row as Record<string, unknown>, String(column.field), event.checked);
    column.editConfig?.change?.(event, row);
  };

  isImageIcon = (button: CommonDataGridActionButtonConfig<T>): boolean => !!button.buttonIconUrl;

  onActionClick = (button: CommonDataGridActionButtonConfig<T>, row: T): void => {
    button.callback(row);
  };

  // ── Filter Sidebar Methods ──────────────────────────────────

  openFilterSidebar = (): void => {
    if (!this.isFilterEnabled()) return;

    // Sync form with currently applied state to discard unsaved/closed changes
    const currentApplied = this.appliedFilterState();
    const initial = this.initialFilterFormValue();
    this.filterForm().patchValue({ ...initial, ...currentApplied });
    this.filterForm().markAsPristine();

    this.isFilterSidebarOpen.set(true);
  };

  closeFilterSidebar = (): void => {
    this.isFilterSidebarOpen.set(false);
  };

  onFilterOverlayBackdropClick = (): void => {
    this.closeFilterSidebar();
  };

  applyFilters = (): void => {
    if (!this.isFilterEnabled()) return;
    const form = this.filterForm();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const rawValue = form.getRawValue() as Record<string, unknown>;
    const mappedFilterValue = this.filterFeatureConfig()?.mapFormValue
      ? this.filterFeatureConfig()!.mapFormValue!(rawValue, form)
      : this.normalizeFilterData(rawValue);

    this.appliedFilterState.set(mappedFilterValue);
    this.patchFilter({
      pageIndex: DEFAULT_GRID_PAGE_INDEX,
      filterData: mappedFilterValue,
    });

    if (this.paginator) this.paginator.firstPage();

    if (this.isSignalStoreMode()) {
      this.requestServerData();
    }

    this.filterFeatureConfig()?.onApply?.({
      filterData: mappedFilterValue,
      formGroup: form,
      gridFilter: this.activeFilter(),
    });

    this.closeFilterSidebar();
  };

  resetFilters = (): void => {
    if (!this.isFilterEnabled()) return;

    const initialValue = this.initialFilterFormValue();
    this.filterForm().reset(initialValue);
    this.filterForm().markAsPristine();

    this.appliedFilterState.set({});
    this.patchFilter({
      pageIndex: DEFAULT_GRID_PAGE_INDEX,
      filterData: {},
    });

    if (this.paginator) this.paginator.firstPage();

    if (this.isSignalStoreMode()) {
      this.requestServerData();
    }

    this.filterFeatureConfig()?.onReset?.(this.filterForm());
  };

  removeFilterChip = (chip: CommonDataGridFilterChip): void => {
    if (!chip?.formControlName) return;

    const names = chip.formControlName.split(',');
    names.forEach(name => {
      const targetControl = this.filterForm().get(name);
      if (targetControl) {
        if (Array.isArray(targetControl.value)) targetControl.setValue([]);
        else targetControl.setValue(null);
      }
    });

    // After setting null/empty, we re-normalize the WHOLE form data.
    // This ensures that any side-effects (like child dropdowns being cleared)
    // are correctly reflected in the chips.
    const nextFilterData = this.normalizeFilterData(this.filterForm().getRawValue());

    this.appliedFilterState.set(nextFilterData);
    this.patchFilter({
      pageIndex: DEFAULT_GRID_PAGE_INDEX,
      filterData: nextFilterData,
    });

    if (this.paginator) this.paginator.firstPage();
    if (this.isSignalStoreMode()) this.requestServerData();

    this.filterFeatureConfig()?.chipConfig?.removeCallback?.({
      chip,
      formGroup: this.filterForm(),
      currentFilterData: nextFilterData,
      gridFilter: this.activeFilter(),
    });
  };

  clearAllFilterChips = (): void => {
    this.filterForm().reset(this.initialFilterFormValue());
    this.appliedFilterState.set({});

    this.patchFilter({
      pageIndex: DEFAULT_GRID_PAGE_INDEX,
      filterData: {},
    });

    if (this.paginator) this.paginator.firstPage();
    if (this.isSignalStoreMode()) this.requestServerData();

    this.filterFeatureConfig()?.chipConfig?.clearAllCallback?.({
      formGroup: this.filterForm(),
      gridFilter: this.activeFilter(),
    });
  };

  // ── Private Helpers ─────────────────────────────────────────

  private patchFilter = (partial: Partial<CommonDataGridFilter<T>>): void => {
    this.activeFilter.update((current) => ({ ...current, ...partial }));
  }

  private updateDataSource = (updater: (ds: MatTableDataSource<T>) => void): void => {
    this.tableDataSource.update((ds) => {
      if (this.featuresConfig()?.enableDragAndDrop) {
        updater(ds);
        return ds;
      } else {
        const next = new MatTableDataSource<T>(ds.data);
        next.sort = ds.sort;
        next.paginator = ds.paginator;
        next.filterPredicate = ds.filterPredicate;
        next.filter = ds.filter;
        updater(next);
        return next;
      }
    });
  }

  private initializeGrid = (): void => {
    const visibleColumns = (this.config().columns ?? []).filter((c) => !c.isHidden);
    this.visibleColumns.set(visibleColumns);


    const columns = visibleColumns.map((c) => String(c.field));
    if (this.config()?.checkboxConfig?.showCheckboxSelection) {
      columns.unshift('select');
    }
    if (this.featuresConfig()?.enableDragAndDrop) {
      columns.unshift('dragHandle');
    }
    if (this.hasActionButtons()) columns.push(this.actionColumnKey);
    this.displayedColumns.set(columns);

    this.isSignalStoreMode.set(!!this.config().signalStore);

    const seedFilter = this.config().gridFilter;
    const initialState = this.config().initialState;
    const resolvedSearchText = this.isSearchApplicable()
      ? (seedFilter?.generalSearch ?? '')
      : '';

    if (!this.isGridInitialized()) {
      this.activeFilter.set({
        pageIndex: initialState?.pageIndex ?? seedFilter?.pageIndex ?? DEFAULT_GRID_PAGE_INDEX,
        pageSize: initialState?.pageSize ?? seedFilter?.pageSize ?? this.pageSize(),
        defaultSortingColumn: initialState?.sortColumn ?? seedFilter?.defaultSortingColumn ?? null,
        sortOrder: initialState?.sortOrder ?? seedFilter?.sortOrder ?? '',
        generalSearch: initialState?.generalSearch ?? resolvedSearchText,
        filterData: initialState?.extraFilters ?? seedFilter?.filterData ?? {},
      });

      this.initializeFilterForm();
    }

    const sortColumn = this.activeFilter()?.defaultSortingColumn;
    const sortDirection = this.activeFilter()?.sortOrder;
    this.currentSort.set({
      active: sortColumn ? String(sortColumn) : '',
      direction: sortDirection === 'asc' || sortDirection === 'desc' ? sortDirection : '',
    });

    if (this.isSignalStoreMode()) {
      this.requestServerData();
    } else {
      this.loadClientData();
    }

    if (this.viewInitialized()) {
      this.attachClientSideMatFeatures();
    }

    setTimeout(() => this.isGridInitialized.set(true), DEFAULT_SEARCH_DEBOUNCE_TIME + 50);
  }

  private loadClientData = (): void => {
    const allRows = this.config()?.data ?? [];

    this.updateDataSource((ds) => {
      ds.data = allRows;
      ds.filterPredicate = (row: T, filterValue: string): boolean => {
        const search = (filterValue ?? '').trim().toLowerCase();
        if (!search) return true;
        return this.visibleColumns().some((column) => {
          const value = this.getCellValue(row, column);
          return String(value ?? '').toLowerCase().includes(search);
        });
      };
      ds.filter = this.isSearchApplicable()
        ? (this.activeFilter().generalSearch as string).trim().toLowerCase()
        : '';
    });

    this.totalRecords.set(this.tableDataSource().filteredData.length);
    this.applyClientPaging();
    this.totalCount.set(allRows.length);
    this.cdr.markForCheck();
  }

  private applyClientPaging = (): void => {
    if (!this.isPaginationDisplayed() || this.isSignalStoreMode() || !this.paginator) return;

    const totalRows = this.tableDataSource().filteredData.length;
    const newPageSize = this.paginator.pageSize || this.activeFilter().pageSize;
    const totalPages = Math.max(1, Math.ceil(totalRows / newPageSize));
    const clampedIndex = Math.min(this.paginator.pageIndex, totalPages - 1);

    if (this.paginator.pageIndex !== clampedIndex) {
      this.paginator.pageIndex = clampedIndex;
    }

    this.patchFilter({
      pageIndex: clampedIndex,
      pageSize: newPageSize,
    });

    this.totalRecords.set(totalRows);

    this.updateDataSource((ds) => {
      ds.paginator = this.paginator;
    });

    this.cdr.markForCheck();
  }

  private attachClientSideMatFeatures = (): void => {
    if (this.isSignalStoreMode()) {
      this.updateDataSource((ds) => {
        ds.sort = null;
        ds.paginator = null;
      });
      return;
    }

    this.updateDataSource((ds) => {
      ds.sort = this.sort ?? null;
      ds.paginator = this.isPaginationDisplayed() && this.paginator ? this.paginator : null;
    });
  }

  private requestServerData = (): void => {
    const filter = this.activeFilter();
    const key = this.getServerRequestKey(filter);
    if (key === this.lastRequestedFilterKey()) return;
    this.lastRequestedFilterKey.set(key);

    const store = this.config()?.signalStore;
    if (!store) return;
    this.loading.set(true);
    store.load({ ...filter });
  }

  refreshData = (): void => {
    this.lastRequestedFilterKey.set('');

    const seedFilter = this.config()?.gridFilter;

    this.patchFilter({
      pageIndex: seedFilter?.pageIndex ?? DEFAULT_GRID_PAGE_INDEX,
      pageSize: seedFilter?.pageSize ?? this.pageSize(),
      defaultSortingColumn: seedFilter?.defaultSortingColumn ?? null,
      sortOrder: seedFilter?.sortOrder ?? '',
      generalSearch: seedFilter?.generalSearch ?? '',
      filterData: seedFilter?.filterData ?? {},
    });

    const sortColumn = this.activeFilter()?.defaultSortingColumn;
    const sortDirection = this.activeFilter()?.sortOrder;
    this.currentSort.set({
      active: sortColumn ? String(sortColumn) : '',
      direction: sortDirection === 'asc' || sortDirection === 'desc' ? sortDirection : '',
    });

    if (this.isFilterEnabled()) {
      const initialValue = this.initialFilterFormValue();
      this.filterForm().reset(initialValue);
      this.filterForm().markAsPristine();
      this.appliedFilterState.set(seedFilter?.filterData ?? {});
      this.filterFeatureConfig()?.onReset?.(this.filterForm());
    }

    if (this.paginator) {
      this.paginator.firstPage();
    }

    this.requestServerData();
  };

  private applySignalStoreState = (rows: T[], totalRecords: number, loading: boolean): void => {
    this.loading.set(!!loading);

    this.updateDataSource((ds) => {
      ds.data = rows ?? [];
    });

    this.totalRecords.set(Number.isFinite(totalRecords) ? totalRecords : (rows?.length ?? 0));
    this.totalCount.set(Number.isFinite(totalRecords) ? totalRecords : (rows?.length ?? 0));
    this.attachClientSideMatFeatures();
    this.cdr.markForCheck();
  }

  goToPage = (pageIndex: number): void => {
    const clampedPageIndex = Math.max(DEFAULT_GRID_PAGE_INDEX, Math.min(pageIndex, this.totalPages() - 1));
    const currentPageIndex = this.getCurrentPageIndex();
    if (clampedPageIndex === currentPageIndex) return;

    const currentPageSize = this.activeFilter().pageSize || DEFAULT_GRID_PAGE_SIZE;
    const pageEvent: PageEvent = {
      length: this.totalRecords(),
      pageIndex: clampedPageIndex,
      pageSize: currentPageSize,
      previousPageIndex: currentPageIndex,
    };

    if (this.paginator) {
      this.paginator.pageIndex = clampedPageIndex;
      this.paginator.pageSize = currentPageSize;
    }

    this.onPageChange(pageEvent);
    this.cdr.markForCheck();
  }

  isCheckboxDisabled = (row: T): boolean =>
    this.config()?.checkboxConfig?.disableCallBack ? this.config().checkboxConfig.disableCallBack(row) : false;

  isCheckboxVisible = (row: T): boolean =>
    this.config()?.checkboxConfig?.checkBoxVisibleCallBack ? this.config().checkboxConfig.checkBoxVisibleCallBack(row) : true;

  private getServerRequestKey = (filter: CommonDataGridFilter<T>): string => {
    return JSON.stringify({
      pageIndex: filter.pageIndex ?? DEFAULT_GRID_PAGE_INDEX,
      pageSize: filter.pageSize ?? DEFAULT_GRID_PAGE_SIZE,
      searchText: filter.generalSearch ?? null,
      sortColumn: filter?.defaultSortingColumn ?? null,
      sortDirection: filter?.sortOrder ?? null,
      filterData: filter.filterData ?? null,
    });
  }

  // ── Filter Form Helpers ─────────────────────────────────────

  private initializeFilterForm = (): void => {
    const filterConfig = this.filterFeatureConfig();
    if (!filterConfig?.form?.formSection?.length) {
      this.filterForm.set(new FormGroup({}));
      this.initialFilterFormValue.set({});
      this.appliedFilterState.set({});
      return;
    }

    // Ensure we don't recreate the form if it is already initialized.
    // This prevents losing unsaved changes in the sidebar when dropdown options arrive asynchronously.
    const currentForm = this.filterForm();
    const hasControls = Object.keys(currentForm.controls).length > 0;
    if (hasControls) {
      // Still update the applied state to ensure chips reflect any filterData changes (e.g. from persistent state)
      const currentFilterData = this.activeFilter().filterData ?? {};
      this.appliedFilterState.set({ ...currentFilterData });
      return;
    }

    const { formGroup, initialValue } = this.createFilterFormGroup(filterConfig);
    const currentFilterData = this.activeFilter().filterData ?? {};
    formGroup.patchValue({ ...initialValue, ...currentFilterData }, { emitEvent: false });

    this.filterForm.set(formGroup);
    this.initialFilterFormValue.set(initialValue);
    this.appliedFilterState.set({ ...currentFilterData });

    filterConfig.formGroupCallback?.(formGroup);
  }

  private createFilterFormGroup = (filterConfig: CommonDataGridFilterFeature<T>): { formGroup: FormGroup; initialValue: Record<string, unknown> } => {
    const formGroup = this.fb.group({});
    const initialValue: Record<string, unknown> = {};
    const configuredInitialValue = filterConfig.initialValue ?? {};

    filterConfig.form.formSection.forEach((section) => {
      (section.controls ?? []).forEach((control) => {
        this.addFilterControl(formGroup, initialValue, configuredInitialValue, control);
      });
    });

    return { formGroup, initialValue };
  }

  private addFilterControl = (
    formGroup: FormGroup,
    initialValue: Record<string, unknown>,
    configuredInitialValue: Record<string, unknown>,
    dynamicControl: DynamicFormControl
  ): void => {
    if (dynamicControl.type === DynamicFormControlType.DateRangePicker) {
      const dateRangeControl = dynamicControl.control as CommonDateRangeConfig;
      this.registerFormControl(formGroup, dateRangeControl.startFormControlName, configuredInitialValue, initialValue, dynamicControl.isRequired);
      this.registerFormControl(formGroup, dateRangeControl.endFormControlName, configuredInitialValue, initialValue, dynamicControl.isRequired);
      return;
    }

    const formControlName = (dynamicControl.control as { formControlName?: string })?.formControlName;
    if (!formControlName) return;
    this.registerFormControl(formGroup, formControlName, configuredInitialValue, initialValue, dynamicControl.isRequired);
  }

  private registerFormControl = (
    formGroup: FormGroup,
    formControlName: string,
    configuredInitialValue: Record<string, unknown>,
    initialValue: Record<string, unknown>,
    isRequired?: boolean
  ): void => {
    const existingValue = configuredInitialValue[formControlName];
    const control = new FormControl(existingValue ?? null, isRequired ? Validators.required : null);

    formGroup.addControl(formControlName, control);
    initialValue[formControlName] = existingValue ?? null;
  }

  private normalizeFilterData = (rawValue: Record<string, unknown>): Record<string, unknown> => {
    const normalized: Record<string, unknown> = {};

    Object.entries(rawValue).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      if (typeof value === 'string' && value.trim() === '') return;
      if (Array.isArray(value) && value.length === 0) return;
      normalized[key] = value;
    });

    return normalized;
  }

  private buildFilterChips = (filterData: Record<string, unknown>): CommonDataGridFilterChip[] => {
    const chips: CommonDataGridFilterChip[] = [];
    if (!filterData || !this.filterFeatureConfig()?.form?.formSection?.length) return chips;

    const processedKeys = new Set<string>();

    Object.entries(filterData).forEach(([formControlName, rawValue]) => {
      if (processedKeys.has(formControlName)) return;

      const dynamicControl = this.findDynamicControlByFormControlName(formControlName);

      if (dynamicControl?.type === DynamicFormControlType.DateRangePicker) {
        const config = dynamicControl.control as CommonDateRangeConfig;
        const startKey = config.startFormControlName;
        const endKey = config.endFormControlName;

        const startVal = filterData[startKey];
        const endVal = filterData[endKey];

        if (startVal || endVal) {
          const startDisplay = startVal ? this.resolveFilterDisplayValue(startKey, startVal) : '';
          const endDisplay = endVal ? this.resolveFilterDisplayValue(endKey, endVal) : '';

          chips.push({
            formControlName: `${startKey},${endKey}`,
            label: config.label ?? SYSTEM_CONST.LABELS.COMMON.DATE_RANGE,
            value: `${startDisplay} - ${endDisplay}`,
            rawValue: { start: startVal, end: endVal },
          });

          processedKeys.add(startKey);
          processedKeys.add(endKey);
        }
        return;
      }

      const label = this.resolveFilterControlLabel(formControlName);
      const displayValue = this.resolveFilterDisplayValue(formControlName, rawValue);
      if (!displayValue) return;

      chips.push({
        formControlName,
        label,
        value: displayValue,
        rawValue,
      });
      processedKeys.add(formControlName);
    });

    return chips;
  }

  private resolveFilterControlLabel = (formControlName: string): string => {
    const sections = this.filterFeatureConfig()?.form?.formSection ?? [];
    for (const section of sections) {
      for (const dynamicControl of section.controls ?? []) {
        const control = dynamicControl.control as any;
        if (dynamicControl.type === DynamicFormControlType.DateRangePicker) {
          const dateRangeControl = dynamicControl.control as CommonDateRangeConfig;
          if (dateRangeControl.startFormControlName === formControlName || dateRangeControl.endFormControlName === formControlName) {
            return dateRangeControl.label ?? formControlName;
          }
        }

        if (control?.formControlName === formControlName) {
          return control?.label ?? formControlName;
        }
      }
    }

    return formControlName;
  }

  private resolveFilterDisplayValue = (formControlName: string, rawValue: unknown): string => {
    const displayValueSource = this.extractFilterDisplayValue(rawValue);
    const actualRawValue = displayValueSource ?? rawValue;

    if (actualRawValue === null || actualRawValue === undefined || actualRawValue === '') return '';
    if (Array.isArray(actualRawValue) && actualRawValue.length === 0) return '';

    if (actualRawValue instanceof Date) return this.datePipe.transform(actualRawValue, CommonDateFormat.DDMMYYYY_WithSlash) ?? '';

    const dynamicControl = this.findDynamicControlByFormControlName(formControlName);

    if (dynamicControl?.type === DynamicFormControlType.DropDown || dynamicControl?.type === DynamicFormControlType.Radiobutton) {
      const control = dynamicControl.control as any;
      const options = (control?.data || control?.options) as ITextValueOption[] ?? [];

      if (options.length === 0) return '';

      const rawValues = Array.isArray(actualRawValue) ? actualRawValue : [actualRawValue];

      const stringifiedRawValues = rawValues.map(v => String(v));
      const selectedLabels = options
        .filter((option) => stringifiedRawValues.includes(String(option.value)))
        .map((option) => option.text);

      if (selectedLabels.length > 0) return selectedLabels.join(', ');

      return '';
    }

    if (dynamicControl?.type === DynamicFormControlType.Datepicker || dynamicControl?.type === DynamicFormControlType.DateRangePicker) {
      const dateValue = actualRawValue as Date | string;
      return this.datePipe.transform(dateValue, CommonDateFormat.DDMMYYYY_WithSlash) ?? String(actualRawValue);
    }

    // Fallback logic for non-dropdown fields
    if (typeof actualRawValue === 'string') return actualRawValue.trim();
    if (Array.isArray(actualRawValue)) return actualRawValue.map((item) => String(item)).join(', ').trim();

    return String(actualRawValue).trim();
  }

  private extractFilterDisplayValue = (rawValue: unknown): unknown => {
    if (!rawValue || typeof rawValue !== 'object' || !('value' in (rawValue as Record<string, unknown>))) {
      return rawValue;
    }

    return (rawValue as Record<string, unknown>)['value'];
  }

  private findDynamicControlByFormControlName = (formControlName: string): DynamicFormControl | null => {
    const sections = this.filterFeatureConfig()?.form?.formSection ?? [];
    for (const section of sections) {
      for (const dynamicControl of section.controls ?? []) {
        if (dynamicControl.type === DynamicFormControlType.DateRangePicker) {
          const dateRangeControl = dynamicControl.control as CommonDateRangeConfig;
          if (dateRangeControl.startFormControlName === formControlName || dateRangeControl.endFormControlName === formControlName) {
            return dynamicControl;
          }
          continue;
        }

        const controlName = (dynamicControl.control as any)?.formControlName;
        if (controlName === formControlName) return dynamicControl;
      }
    }

    return null;
  }

  private resolveValueByPath = (source: unknown, path: string): unknown => {
    if (!source || !path) return undefined;
    return path.split('.').reduce((acc: any, key) => acc?.[key], source as any);
  }

  private assignValueByPath = (source: Record<string, unknown>, path: string, value: unknown): void => {
    if (!source || !path) return;
    const keys = path.split('.');
    let current: Record<string, unknown> = source;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') current[key] = {};
      current = current[key] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
  }

  private isIsActiveField = (column: CommonDataGridColumnConfig<T>): boolean => {
    return String(column.field).trim().toLowerCase() === 'isactive';
  }

  // ── Checkbox / Selection Methods ────────────────────────────

  onSelection = (element: T): void => {
    if (this.isCheckboxDisabled(element)) return;
    if (this.masterCheckboxState() === 'checked') {
      this.excludedData().push(element);
      this.isMasterCheckboxClicked.set(true);
    } else if (this.masterCheckboxState() === 'intermediate') {
      if (this.includedData().length > 0) {
        const index = this.includedData().findIndex(item => CommonHelper.isObjectEqual(item, element));
        index === -1 ? this.includedData().push(element) : this.includedData().splice(index, 1)
        this.isMasterCheckboxClicked.set(false);
      }
      if (this.excludedData().length > 0) {
        const excludeindex = this.excludedData().findIndex(item => CommonHelper.isObjectEqual(item, element));
        excludeindex === -1 ? this.excludedData().push(element) : this.excludedData().splice(excludeindex, 1);
        this.isMasterCheckboxClicked.set(true);
      }
    } else if (this.masterCheckboxState() === 'notSelected') {
      this.includedData().push(element)
      this.isMasterCheckboxClicked.set(false);
    }
    this.masterCheckbox && this.updateMasterCheckbox();
    this.config().checkboxConfig.getSelectedRows && this.config().checkboxConfig.getSelectedRows(this.includedData(), this.excludedData(), this.masterCheckboxState(), this.getSelectedDataCount());
  }

  getSelectedDataCount() {
    return this.includedData().length > 0 ? this.includedData().length : (this.totalCount() - this.getExcludedCount - this.excludedData().length);
  }

  onMasterCheckboxSelection = (): void => {
    this.masterCheckboxState.update(item => this.masterCheckbox?.checked ? 'checked' : 'notSelected');
    this.includedData.set([]);
    this.excludedData.set([]);

    if (this.masterCheckboxState() === 'checked') {
      const disabledRows = this.tableDataSource().data.filter(row => this.isCheckboxDisabled(row));
      this.excludedData.set([...disabledRows]);
    }

    this.config().checkboxConfig.getSelectedRows && this.config().checkboxConfig.getSelectedRows(this.includedData(), this.excludedData(), this.masterCheckboxState(), this.getSelectedDataCount());
  }

  resetMasterCheckBox() {
    this.masterCheckboxState.set('notSelected');
    if (this.masterCheckbox) {
      this.masterCheckbox.checked = false;
      this.masterCheckbox.indeterminate = false;
    }
    this.includedData.set([]);
    this.excludedData.set([]);
    this.config().checkboxConfig.getSelectedRows && this.config().checkboxConfig.getSelectedRows(this.includedData(), this.excludedData(), this.masterCheckboxState(), this.getSelectedDataCount());
  }

  updateMasterCheckbox = (): void => {
    if ((this.includedData().length > 0 || this.excludedData().length > 0) && this.includedData().length !== (this.totalCount() - this.getExcludedCount) && this.excludedData().length !== (this.totalCount() - this.getExcludedCount)) {
      this.masterCheckbox.indeterminate = true;
      this.masterCheckbox.checked = false;
      this.masterCheckboxState.set('intermediate')
    } else if (this.includedData().length == (this.totalCount() - this.getExcludedCount) || this.excludedData().length === 0 && this.isMasterCheckboxClicked()) {
      this.masterCheckbox.checked = true;
      this.masterCheckbox.indeterminate = false;
      this.masterCheckboxState.set('checked');
      this.includedData.set([]);
      this.excludedData.set([]);
    } else if ((!this.isMasterCheckboxClicked() && this.includedData().length === 0) || (this.isMasterCheckboxClicked() && this.excludedData().length === (this.totalCount() - this.getExcludedCount))) {
      this.resetMasterCheckBox();
    }
  }

  isDataSelected = (element: T): boolean => {
    if (this.isCheckboxDisabled(element)) return false;
    if (this.masterCheckboxState() === 'checked') {
      return true;
    } else if (this.masterCheckboxState() === 'intermediate') {
      if (this.excludedData().length === 0) {
        return this.includedData().some(item => this.getItemId(item) === this.getItemId(element));
      } else {
        return !this.excludedData().some(item => this.getItemId(item) === this.getItemId(element));
      }
    } else {
      return false;
    }
  }

  private getItemId(item: any): any {
    return item?.id ?? item?.studentId ?? JSON.stringify(item);
  }

  visiblePageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentpageIndex();
    const delta = 2;
    const pages: number[] = [];
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      pages.push(i);
    }
    return pages;
  });
}
