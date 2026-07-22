import { MatRadioChange } from "@angular/material/radio";
import { OrientationType } from "../../../models/orientation.model";
import { FormControlBaseConfig } from "../../../models/form-control-base.model";
import { commonType, ITextValueOption } from "../../../models/common.model";

export interface CommonRadioButtonConfig extends FormControlBaseConfig {
    name?: string;
    orientation?: OrientationType;
    value?: number | string | null;
    disabled?: boolean;
    options: ITextValueOption[];
    change?: (event: MatRadioChange) => void;
    disableCallback?: (value: commonType) => boolean;
    cssClassCallback?: (option: ITextValueOption) => string;
}