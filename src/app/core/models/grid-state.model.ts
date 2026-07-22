import { CommonDataGridSortDirection } from "../../shared/components/common-data-grid/types/grid.type";

export interface GridState {
    pageIndex: number;
    pageSize: number;
    sortColumn: string | null;
    sortOrder: CommonDataGridSortDirection;
    generalSearch: string;
    extraFilters?: any;
}

export const DEFAULT_GRID_STATE: GridState = {
    pageIndex: 0,
    pageSize: 10,
    sortColumn: null,
    sortOrder: '',
    generalSearch: '',
};