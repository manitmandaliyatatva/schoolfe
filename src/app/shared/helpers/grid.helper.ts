import { CommonButtonConfig } from '../components/button/model/button.model';
import { FilterCondition, IColumns } from "../../core/models/request.model";
import { DEFAULT_GRID_PAGE_INDEX, DEFAULT_GRID_PAGE_SIZE } from "../components/common-data-grid/constants/grid.constant";
import { CommonDataGridFilter } from "../components/common-data-grid/model/common-data-grid.model";
import CommonHelper from "../../core/helpers/common-helper";

export interface GridToolbarButtonConfig {
    icon: string;
    tooltipText: string;
    callback: (element?: any) => void;
    isBtnVisible?: () => boolean;
    disableCallBack?: () => boolean;
    isPrimary?: boolean;
}

export const buildGridToolbarButton = (config: GridToolbarButtonConfig): CommonButtonConfig => ({
    variant: 'flat',
    color: config.isPrimary ? 'primary' : 'basic',
    icon: config.icon,
    tooltipText: config.tooltipText,
    callback: config.callback,
    visibleCallback: config.isBtnVisible,
    disableCallBack: config.disableCallBack,
    cssClasses: ['square-icon-btn'],
});

export const buildGridListRequest = <T>(
    filter: CommonDataGridFilter<T>,
): {
    pageIndex: number;
    pageSize: number;
    generalSearch: string;
    defaultSortingColumn: string;
    sortOrder: 'asc' | 'desc' | '';
    columns: IColumns[];
} => ({
    pageIndex: filter?.pageIndex || DEFAULT_GRID_PAGE_INDEX,
    pageSize: filter?.pageSize || DEFAULT_GRID_PAGE_SIZE,
    generalSearch: filter?.generalSearch ?? '',
    defaultSortingColumn: filter?.defaultSortingColumn != null ? String(filter.defaultSortingColumn) : '',
    sortOrder: filter?.sortOrder === 'desc' ? 'desc' : filter?.sortOrder === 'asc' ? 'asc' : '',
    columns: buildFilterColumns(filter?.filterData),
});

const buildFilterColumns = (filterData?: Record<string, unknown>): IColumns[] => {
    if (!filterData) return [];

    return Object.entries(filterData)
        .filter(([, value]) => value !== null && value !== undefined && value !== '')
        .map(([key, value]) => ({
            name: key,
            filterSearch: {
                value: String(value),
                condition: FilterCondition.Contains,
            },
        }));
};

export const markRowSoftDeleted = <T>(
    items: T[],
    row: T,
    idSelector: (item: T) => string | number | null,
    softDeleteKey: keyof T,
): T[] => {
    const targetId = idSelector(row);
    const targetIndex = items.findIndex((item) =>
        item === row || (!CommonHelper.isEmpty(targetId) && idSelector(item) === targetId)
    );
    if (targetIndex < 0) return items;

    return items.map((item, index) =>
        index === targetIndex ? { ...item, [softDeleteKey]: true } : item
    );
};