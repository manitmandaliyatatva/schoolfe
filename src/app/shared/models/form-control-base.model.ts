import { MatFormFieldAppearance } from "@angular/material/form-field";

export interface FormControlBaseConfig {
    formControlName: string;
    label: string;
    labelCssStyles?: string[];
    isFloatLabel?: boolean;
    appearance?: MatFormFieldAppearance;
    controlType?: DynamicFormControlType;
}


export enum DynamicFormControlType {
    Text = 'text',
    Number = 'number',
    DecimalNumber = 'decimalNumber',
    Email = 'email',
    Password = 'password',
    ContactNumber = 'contactNumber',
    Checkbox = 'checkbox',
    SingleCheckbox = 'single-checkbox',
    Datepicker = 'datepicker',
    Timepicker = 'timepicker',
    DateTimepicker = 'datetimepicker',
    DropDown = 'dropdown',
    Radiobutton = 'radiobutton',
    SlideToggle = 'slidetoggle',
    TextArea = 'textarea',
    DateRangePicker = 'daterangepicker',
    Autocomplete = 'autocomplete',
    Options = 'options',
    Button = 'button',
    Slider = 'slider',
    ToothPicker = 'tooth-picker',
    ActionButton = 'actionButton',
    HtmlEditor = 'htmlEditor',
    ImageUpload = 'imageupload',
    DocumentUpload = 'documentupload',
    ColorPicker = 'colorpicker',
    StarRating = 'starrating',
    TextEditor = 'texteditor'
}