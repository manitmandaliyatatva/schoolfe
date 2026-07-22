import { ITextValueOption } from "../../../models/common.model";
import { DynamicFormControlType } from "../../../models/form-control-base.model";
import { CommonCheckboxConfig } from "../../common-checkbox/models/common-checkbox.model";
import { CommonDatepickerConfig } from "../../common-datepicker/model/common-datepicker.model";
import { CommonDateRangeConfig } from "../../common-daterange/model/common-daterange.model";
import { CommonDropdownConfig } from "../../common-dropdown/model/common-dropdown.model";
import { CommonRadioButtonConfig } from "../../common-radio-button/models/common-radio-button.model";
import { CommonSlideToggleConfig } from "../../common-slide-toggle/models/common-slide-toggle.model";
import { CommonTextboxConfig } from "../../textbox/model/textbox.model";
import { CommonTimepickerConfig } from "../../common-timepicker/model/common-timepicker.model";
import { CommonPhotoUploadConfig } from "../../photo-upload/model/photo-upload.model";
import { DocumentUploadConfig } from "../../document-upload/model/document-upload.model";
import { CommonColorPickerConfig } from "../../colorpicker/model/colorpicker.model";
import { StarRatingConfig } from "../../star-rating/models/star-rating.model";
import { CommonTextEditorConfig } from "../../text-editor/models/text-editor.model";

export interface DynamicForm {
    formSection: SectionControls[];
}

export interface SectionControls {
    title?: string;
    controls: DynamicFormControl[];
    isHiddenSection?: () => boolean;
}

export interface DynamicFormControl {
    control: CommonColorPickerConfig | CommonTextboxConfig | CommonDropdownConfig | CommonDatepickerConfig | CommonDateRangeConfig | CommonRadioButtonConfig | CommonSlideToggleConfig | CommonCheckboxConfig | CommonTimepickerConfig | CommonPhotoUploadConfig | DocumentUploadConfig | StarRatingConfig | CommonTextEditorConfig;
    type: DynamicFormControlType,
    isRequired?: boolean
    class?: string,
    conditionList?: ITextValueOption[],
    condition?: number,
    name?: string
    isHiddenField?: () => boolean,
    isFixedFilter?: boolean,
    isActionButton?: boolean,
    isSearchabale?: boolean,
    isOrderable?: boolean
}