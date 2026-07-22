export interface IDashboardTableColumn {
  header: string;
  key: string;
  width?: string;
  type?: 'text' | 'highlight' | 'progress' | 'boolean' | 'date' | 'badge';
  class?: string;
  badgeClass?: (value: any) => string;
  totalKey?: string;
  valueKey?: string;
  showInfo?: boolean;
  infoKeys?: { label: string; key: string }[];
  /** Optional formatter to transform the cell value for display */
  formatter?: (value: any, row: any) => string;
}

export interface IDashboardTableConfig {
  columns: IDashboardTableColumn[];
}
