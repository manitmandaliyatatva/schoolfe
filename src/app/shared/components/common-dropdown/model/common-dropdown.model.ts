import { MatFormFieldAppearance } from "@angular/material/form-field";
import { DynamicFormControlType } from "../../../models/form-control-base.model";
import { ITextValueOption } from "../../../models/common.model";

export interface CommonDropdownConfig extends FormControlBaseConfig {
    data: Array<ITextValueOption>;
    features?: CommonDropdownFeatures;
    selectionChange?(data: ITextValueOption | ITextValueOption[]): void;
    value?: string[] | number[];
    getMoreOptions?(pageIndex: any, pageSize: any, searchValue: any): Promise<{ pageCount: number, data: ITextValueOption[], totalCount : number }>;
    selectedOptions?: ITextValueOption[];
}
export interface CommonDropdownFeatures {
    allowClear?: boolean;
    allowClearAll?: boolean;
    allowSearching?: boolean;
    allowMultiple?: boolean;
    allowGrouping?: boolean;
    selectedItemsToDisplay?: 1 | 2 | 3 | 4 | 5;
    showAllOptions?: boolean;
    searchPlaceholderLabel?: string;
    searchNoEntriesFoundLabel?: string;
    hideClearSearchButton?: boolean;
    showToggleAllCheckbox?: boolean;
    enableLazyLoading?: boolean;
    loadDataFromApi?: boolean;
    enableSelectOption?: boolean,
    pageSize?: number,
    isDisable?: boolean,
    showTooltip?: boolean,
    hideChips?: boolean,
    enableSelectAllOption?: boolean;
    selectAllOptionLabel?: string;
    excludeCallback?: (option: ITextValueOption) => boolean;
}

export interface DropdownSelectionResult {
    values: (number | string | boolean)[];
    isSelectAllSelected: boolean;
}

export const DROPDOWN_SELECT_ALL_VALUE = '__SELECT_ALL__';

export function filterSelectAllValue<T>(values: T[]): T[] {
    return values?.filter(v => v !== DROPDOWN_SELECT_ALL_VALUE as unknown as T) || [];
}

export interface FormControlBaseConfig {
    id?: string;
    formControlName: string;
    label: string;
    labelCssStyles?: string[];
    isFloatLabel?: boolean;
    appearance?: MatFormFieldAppearance;
    controlType?: DynamicFormControlType;
}