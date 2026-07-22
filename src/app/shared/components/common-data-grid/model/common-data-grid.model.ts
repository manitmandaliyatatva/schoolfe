import { TemplateRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommonDateFormat } from '../../../../core/constants/date-format.constant';
import { GridState } from '../../../../core/models/grid-state.model';
import { CommonButtonConfig } from '../../button/model/button.model';
import { DynamicForm } from '../../dynamic-form/model/dynamic-form.model';
import { CommonDataGridFieldDataType, CommonDataGridFieldType } from '../enums/grid.enum';
import { CommonDataGridControlType, CommonDataGridSortDirection } from '../types/grid.type';

export interface StatusChipColumnConfig<T> {
  activeText?: string;
  inactiveText?: string;
  value?: (row: T) => boolean;
  isHidden?: (row: T) => boolean;
}

export interface CommonDataGridOrder<T> {
  defaultSortingColumn: keyof T | null;
  sortOrder: CommonDataGridSortDirection;
}

export interface CommonDataGridFilter<T> {
  pageIndex: number;
  pageSize: number;
  generalSearch?: string;
  defaultSortingColumn: keyof T | null | string;
  sortOrder: CommonDataGridSortDirection;
  filterData?: Record<string, unknown>;
}

export interface CommonDataGridStyle {
  width?: string | number;
}

export interface CommonDataGridColumnConfig<T> {
  title: string;
  field: keyof T;
  isSortable?: boolean;
  isHidden?: boolean;
  style?: CommonDataGridStyle;
  fieldDataType?: CommonDataGridFieldDataType;
  fieldType?: CommonDataGridFieldType;
  displayFormat?: CommonDateFormat;
  customRenderCell?: TemplateRef<any>;
  callback?: (row: T) => void;
  editConfig?: CommonDataGridEditConfig<T>;
  statusConfig?: StatusChipColumnConfig<T>;
  cellStyle ?:(row: T) => void; 
  alignment?: 'left' | 'center' | 'right';
  hasPermission?: boolean | ((row: T) => boolean);
}

export interface CommonDataGridEditConfig<T> {
  isEditable?: boolean;
  controlType?: CommonDataGridControlType;
  change?: (event: unknown, row: T) => void;
}

export interface CommonDataGridActionButtonConfig<T> {
  buttonIconUrl?: string;
  matIconName: string;
  buttonText: string;
  tooltipText?: string;
  callback: (row: T) => void;
  visibleCallback?: (row: T) => boolean;
  disableCallback?: (row: T) => boolean;
}

export interface CommonDataGridPaginatorFeatures {
  defaultPagesize?: number;
  pageSizeOptions?: number[];
  showFirstLastButton?: boolean;
}

// ── Filter Feature Interfaces ──────────────────────────────────

export interface CommonDataGridFilterFeature<T> {
  title?: string;
  form: DynamicForm;
  initialValue?: Record<string, unknown>;
  showToggleButton?: boolean;
  toggleButtonText?: string;
  applyButtonText?: string;
  resetButtonText?: string;
  formGroupCallback?: (formGroup: FormGroup) => void;
  mapFormValue?: (rawValue: Record<string, unknown>, formGroup: FormGroup) => Record<string, unknown>;
  chipConfig?: CommonDataGridFilterChipConfig<T>;
  onApply?: (event: CommonDataGridFilterApplyEvent<T>) => void;
  onReset?: (formGroup: FormGroup) => void;
}

export interface CommonDataGridFilterApplyEvent<T> {
  filterData: Record<string, unknown>;
  formGroup: FormGroup;
  gridFilter: CommonDataGridFilter<T>;
}

export interface CommonDataGridFilterChip {
  formControlName: string;
  label: string;
  value: string;
  rawValue: unknown;
}

export interface CommonDataGridFilterChipRemoveEvent<T> {
  chip: CommonDataGridFilterChip;
  formGroup: FormGroup;
  currentFilterData: Record<string, unknown>;
  gridFilter: CommonDataGridFilter<T>;
}

export interface CommonDataGridFilterChipClearAllEvent<T> {
  formGroup: FormGroup;
  gridFilter: CommonDataGridFilter<T>;
}

export interface CommonDataGridFilterChipConfig<T> {
  allowClearAll?: boolean;
  removeCallback?: (event: CommonDataGridFilterChipRemoveEvent<T>) => void;
  clearAllCallback?: (event: CommonDataGridFilterChipClearAllEvent<T>) => void;
}

// ── Toolbar Config ─────────────────────────────────────────────

export interface CommonDataGridToolbarConfig {
  buttonConfig?: CommonButtonConfig[];
}

// ── Features ───────────────────────────────────────────────────

export interface CommonDataGridFeatures<T = any> {
  showPagination?: boolean;
  paginatorFeatures?: CommonDataGridPaginatorFeatures;
  hideHeaderRow?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchDebounceMs?: number;
  showRefreshButton?: boolean;
  isMergeColumn?: (row: T) => boolean;
  mergeColumnSpan?: number;
  filter?: CommonDataGridFilterFeature<T>;
  toolbar?: CommonDataGridToolbarConfig;
  customViewTemplate?: TemplateRef<any>;
  enableDragAndDrop?: boolean;
}

export interface CommonDataGridStore<T> {
  load: (filter: CommonDataGridFilter<T>) => void;
  list?: () => T[];
  recordsFiltered?: () => number;
  isLoading?: () => boolean;
}

export interface CommonDataGrid<T> {
  id?: string;
  primaryKey?: keyof T | string;
  features?: CommonDataGridFeatures<T>;
  addButton?: CommonButtonConfig;
  data?: T[];
  signalStore?: CommonDataGridStore<T>;
  columns: CommonDataGridColumnConfig<T>[];
  actionButtons?: CommonDataGridActionButtonConfig<T>[];
  gridFilter?: CommonDataGridFilter<T>;
  excludedDataCount?: number;
  customRenderTemplateCallback?(templateName: string): TemplateRef<any>;
  initialState?: GridState;
  checkboxConfig?: CommonDataGridCheckboxConfig<T>;
}
export interface CommonDataGridCheckboxConfig<T> {
  showCheckboxSelection?: boolean;
  showMasterCheckBox?: boolean;
  getSelectedRows?: (
    includedData: T[],
    excludedData: T[],
    masterCheckboxState: SelectionState,
    selectedDataCount: number
  ) => void;
  checkBoxVisibleCallBack?(element: T): boolean;
  disableCallBack?(element: T): boolean;
}

export type SelectionState = 'checked' | 'intermediate' | 'notSelected';