import { MatFormFieldAppearance } from '@angular/material/form-field';
import { TooltipPosition } from '@angular/material/tooltip';
import { CommonButtonConfig } from '../components/button/model/button.model';
import {
  CommonCheckboxConfig,
  CommonCheckboxOption,
} from '../components/common-checkbox/models/common-checkbox.model';
import { CommonRadioButtonConfig } from '../components/common-radio-button/models/common-radio-button.model';
import { CommonSlideToggleConfig } from '../components/common-slide-toggle/models/common-slide-toggle.model';
import { CommonTextboxConfig, TextBoxIconConfig } from '../components/textbox/model/textbox.model';
import { CommonTimepickerConfig } from '../components/common-timepicker/model/common-timepicker.model';
import { InputType } from '../Enums/common.enum';
import { ITextValueOption } from '../models/common.model';
import { OrientationType } from '../models/orientation.model';
import { CommonDropdownConfig, CommonDropdownFeatures } from '../components/common-dropdown/model/common-dropdown.model';
import { CommonDatepickerConfig } from '../components/common-datepicker/model/common-datepicker.model';
import { CommonDateRangeConfig } from '../components/common-daterange/model/common-daterange.model';
import { DocumentUploadConfig, UploadedDocument } from '../components/document-upload/model/document-upload.model';
import { FileExtension } from '../components/photo-upload/model/photo-upload.model';
import { CommonColorPickerConfig } from '../components/colorpicker/model/colorpicker.model';
import { genericDropdownStore } from '../../features/common/communication/notice-audiance-group/model/notice-auduence-group.model';

export type CallbackFunction = (event?: any, index?: any) => void;

export function getTextboxConfig(
  label: string,
  formControlName: string,
  value?: string | number,
  type?: InputType,
  appearance?: MatFormFieldAppearance,
  placeholder?: any,
  disableCallBack?: any,
  prefixIcon?: any,
  suffixIcon?: any,
  hintText?: any,
  imgUrl?: TextBoxIconConfig,
  prefixIconList?: any,
  suffixIconList?: any,
  change?: CallbackFunction,
  keyup?: CallbackFunction,
  keypress?: CallbackFunction,
  blur?: CallbackFunction,
  isSuffixImg?: any,
  isPrefixImg?: any,
  textSuffix?: any,
  textSuffixSelect?: any,
  isPlusMinusVisible?: any,
  allowFloatValues = true,
  isFloatLabel = false,
  maskingPattern?: any,
  maxLength?: number
) {
  const appTextBox: CommonTextboxConfig = {
    label,
    formControlName,
    type: type ?? InputType.text,
    prefixIcon,
    suffixIcon,
    placeholder,
    hintText,
    imgUrl,
    change,
    keyup,
    keypress,
    prefixIconList,
    suffixIconList,
    blur,
    appearance: appearance ?? 'outline',
    disableCallBack,
    isSuffixImg,
    isPrefixImg,
    textSuffix,
    value,
    textSuffixSelect,
    isPlusMinusVisible,
    allowFloatValues,
    isFloatLabel,
    maskingPattern,
    maxLength,
  };
  if (change) change();
  if (keyup) keyup();
  if (keypress) keypress();
  if (blur) blur();
  return appTextBox;
}

export function getButtonConfig(
  callback: CallbackFunction,
  variant: 'raised' | 'flat' | 'stroked' | 'fab' | 'icon' | 'basic',
  color: 'basic' | 'primary' | 'warn' | 'accent',
  buttonText?: string,
  isPrimary?: boolean,
  disableCallBack?: () => boolean,
  icon?: string,
  iconUrl?: string,
  tooltipText?: string,
  tooltipPosition?: TooltipPosition,
  cssClasses?: string[],
  type?: 'submit' | 'reset' | 'button',
  visibleCallback?: (element: any) => boolean
) {
  const appButton: CommonButtonConfig = {
    variant,
    color,
    icon,
    iconUrl,
    isPrimary,
    buttonText,
    tooltipText,
    tooltipPosition,
    disableCallBack,
    cssClasses,
    callback,
    type,
    visibleCallback,
  };
  return appButton;
}

export function getCheckBoxConfig(
  formControlName: string,
  label: string,
  appearance: MatFormFieldAppearance = 'outline',
  options: CommonCheckboxOption[],
  orientation?: OrientationType,
  disabled?: boolean,
  change?: CallbackFunction,
  disableCallback?: (value: number | string) => boolean,
  cssClassCallback?: (option: CommonCheckboxOption) => string
) {
  const checkBoxConfig: CommonCheckboxConfig = {
    formControlName,
    label,
    appearance,
    options,
    orientation,
    disabled,
    change,
    disableCallback,
    cssClassCallback,
  };
  return checkBoxConfig;
}

export function getSlideToggleConfig(
  formControlName: string,
  label: string,
  labelPosition?: 'before' | 'after',
  color?: 'primary' | 'accent' | 'warn',
  change?: (event: boolean) => void,
  isDisable?: any
) {
  const slideToggleConfig: CommonSlideToggleConfig = {
    formControlName,
    label,
    labelPosition,
    color,
    change,
    isDisable,
  };
  return slideToggleConfig;
}

export function getTimepickerConfig(
  formControlName: string,
  label: string,
  placeholder?: string,
  minTime?: string,
  maxTime?: string,
  appearance: MatFormFieldAppearance = 'outline',
  isFloatLabel = false,
): CommonTimepickerConfig {
  return {
    formControlName,
    label,
    placeholder,
    minTime,
    maxTime,
    appearance,
    isFloatLabel,
    id: `${formControlName}Id`,
  };
}

export function getRadioButtonConfig(
  formControlName: string,
  label: string,
  options?: ITextValueOption[],
  change?: (event?: any) => void,
  appearance: MatFormFieldAppearance = 'outline',
  orientation: 'horizontal' | 'vertical' = 'horizontal',
  labelCssStyles?: string[]
) {
  const checkBoxConfig: CommonRadioButtonConfig = {
    formControlName,
    label,
    options: options ?? [],
    change,
    appearance,
    orientation,
    labelCssStyles,
  };
  if (change) change();
  return checkBoxConfig;
}

export function getDropdownConfig(
  formControlName: string,
  label: string,
  data?: ITextValueOption[],
  features?: CommonDropdownFeatures,
  selectedOptions?: ITextValueOption[],
  callback?: (data: ITextValueOption | ITextValueOption[]) => void,
  value?: string[] | number[],
  isFloatLabel = false,
): CommonDropdownConfig {
  return {
    label: label,
    formControlName: formControlName,
    appearance: 'outline',
    data: data || [],
    features: {
      allowClear: true,
      allowSearching: true,
      ...features
    },
    id: `${formControlName}Id`,
    selectedOptions: selectedOptions || [],
    selectionChange: (data: ITextValueOption) => callback && callback(data),
    isFloatLabel: isFloatLabel,
    value: value
  };
}

export function getDatePickerConfig(
  formControlName: string,
  label: string,
  appearance?: MatFormFieldAppearance,
  placeholder?: string,
  min?: () => Date,
  max?: () => Date,
  callback?: () => void,
  filterDate?: () => boolean,
  isFloatLabel?: boolean,
  disableSundays?:boolean,
  disabledDates?:Date[]
): CommonDatepickerConfig {
  return {
    formControlName,
    label,
    appearance,
    placeholder,
    isFloatLabel: isFloatLabel ?? false,
    min,
    max,
    onChangeDate: callback,
    filterDate,
    disableSundays,
    disabledDates
  }
}

export function getDropdownConfigWithLazyLoading(
  formControlName: string,
  label: string,
  selectedId: string,
  dropdownStore: InstanceType<typeof genericDropdownStore>,
  API_URL: string,
  columns: any[],
  selectedOptions?: ITextValueOption[],
  callback?: (data: ITextValueOption) => void,
  features?: CommonDropdownFeatures,
  data?: ITextValueOption[],
  isFloatLabel = false,
): CommonDropdownConfig {

  let currentSelectedId = selectedId;
  let currentPageIndex = 0;
  let internalData = data || [];

  return {
    label,
    formControlName,
    appearance: 'outline',
    data: internalData,
    features: {
      allowClear: true,
      allowMultiple: false,
      allowSearching: true,
      showAllOptions: true,
      enableLazyLoading: true,
      loadDataFromApi: true,
      showToggleAllCheckbox: false,
      pageSize: 10,
      ...features
    },
    id: `${formControlName}Id`,
    selectedOptions: selectedOptions || [],


    getMoreOptions: (pageIndex: number, pageSize: number, searchValue: string) => {
      return new Promise((resolve, reject) => {

        // ✅ Reset pagination if selectedId changed
        if (pageIndex == 0) {
          currentSelectedId = selectedId;
          currentPageIndex = 0;
          pageIndex = 0;

          // ✅ Clear old keys from store for previous selectedId
          dropdownStore.resetState()
          internalData.length = 0;
        } else {
          currentPageIndex = pageIndex;
        }

        // ✅ Always force fresh load
        dropdownStore.getAll({
          endpoint: API_URL,
          body: {
            columns: columns,
            defaultSortingColumn: '',
            generalSearch: '',
            pageIndex,
            pageSize,
            sortOrder: ''
          },
        });

        const interval = setInterval(() => {
          const result = dropdownStore.list();
          if (result && result.length > 0) {
            clearInterval(interval);
            resolve({
              pageCount: result.length < pageSize ? pageIndex : pageIndex + 1,
              data: result,
              totalCount: dropdownStore.totalRecords()
            });
          }
        }, 100);

        setTimeout(() => {
          clearInterval(interval);
          reject('Dropdown load timeout');
        }, 10000);
      });
    },

    selectionChange: (data: ITextValueOption) => callback && callback(data),
    isFloatLabel: isFloatLabel,
  };
}

export function getDocumentUploadConfig(
  formControlName: string,
  label: string,
  allowedExtensions?: FileExtension[],
  multiple?: boolean,
  buttonText?: string,
  viewEndpoint?: string,
  viewParamKey?: string,
  fileNameParamKey?: string,
  onView?: (file: UploadedDocument) => void,
  onRemove?: (file: UploadedDocument, index: number) => void,
  onAdd?: (file: UploadedDocument) => void,
): DocumentUploadConfig {
  return {
    formControlName,
    label,
    allowedExtensions: allowedExtensions ?? ['.pdf'],
    multiple: multiple ?? false,
    buttonText,
    viewEndpoint,
    viewParamKey,
    fileNameParamKey,
    onView,
    onRemove,
    onAdd,
  };
}

export function getColorPickerConfig(
  label: string,
  formControlName: string,
  appearance: MatFormFieldAppearance = 'outline',
  isFloatLabel = false,
  change?: (event?: Event, rowId?: number) => void,
  blur?: (event?: FocusEvent, rowId?: number) => void,
  placeholder?: string,
  hintText?: string,
): CommonColorPickerConfig {
  return {
    label,
    formControlName,
    appearance,
    isFloatLabel,
    change,
    blur,
    placeholder,
    hintText,
  };
}

export function getDateRangeConfig(
  label: string,
  startFormControlName: string,
  endFormControlName: string,
  appearance: MatFormFieldAppearance = 'outline',
  isFloatLabel = false,
  startPlaceholder = 'From',
  endPlaceholder = 'To',
  min?: () => Date,
  max?: () => Date
): CommonDateRangeConfig {
  return {
    label,
    startFormControlName,
    endFormControlName,
    appearance,
    isFloatLabel,
    startPlaceholder,
    endPlaceholder,
    min,
    max,
  };
}
