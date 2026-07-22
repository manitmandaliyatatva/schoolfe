import { FormControlBaseConfig } from "../../../models/form-control-base.model";

export interface CommonColorPickerConfig extends FormControlBaseConfig {
    placeholder?: string;
    hintText?: string;
    change?(event? : Event, rowId? : number): void;
    blur?(event? : FocusEvent, rowId? : number): void;
    isFloatLabel?: boolean;
}
