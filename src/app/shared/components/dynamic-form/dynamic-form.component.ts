import { AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, OnInit, QueryList, signal, SimpleChanges, ViewChildren } from '@angular/core';
import { DynamicForm, DynamicFormControl, SectionControls } from './model/dynamic-form.model';
import { ControlContainer, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TextboxComponent } from '../textbox/textbox.component';
import { CommonDropdownComponent } from '../common-dropdown/common-dropdown.component';
import { CommonDatepickerComponent } from '../common-datepicker/common-datepicker.component';
import { CommonDaterangeComponent } from '../common-daterange/common-daterange.component';
import { CommonCheckbox } from '../common-checkbox/common-checkbox';
import { CommonRadioButton } from '../common-radio-button/common-radio-button';
import { CommonSlideToggle } from '../common-slide-toggle/common-slide-toggle';
import { CommonTimepickerComponent } from '../common-timepicker/common-timepicker.component';
import { CommonDatepickerConfig } from '../common-datepicker/model/common-datepicker.model';
import { CommonDateRangeConfig } from '../common-daterange/model/common-daterange.model';
import { CommonDropdownConfig } from '../common-dropdown/model/common-dropdown.model';
import { CommonRadioButtonConfig } from '../common-radio-button/models/common-radio-button.model';
import { CommonSlideToggleConfig } from '../common-slide-toggle/models/common-slide-toggle.model';
import { CommonTextboxConfig } from '../textbox/model/textbox.model';
import { CommonCheckboxConfig } from '../common-checkbox/models/common-checkbox.model';
import { PhotoUploadComponent } from '../photo-upload/photo-upload.component';
import { CommonPhotoUploadConfig } from '../photo-upload/model/photo-upload.model';
import { CommonTimepickerConfig } from '../common-timepicker/model/common-timepicker.model';
import { DocumentUploadComponent } from '../document-upload/document-upload.component';
import { DocumentUploadConfig } from '../document-upload/model/document-upload.model';
import { ColorPickerComponent } from '../colorpicker/colorpicker.component';
import { CommonColorPickerConfig } from '../colorpicker/model/colorpicker.model';
import { StarRating } from '../star-rating/star-rating';
import { StarRatingConfig } from '../star-rating/models/star-rating.model';
import { CommonTextEditorConfig } from '../text-editor/models/text-editor.model';
import { TextEditor } from '../text-editor/text-editor';

@Component({
  selector: 'common-dynamic-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TextboxComponent,
    CommonDropdownComponent,
    CommonDatepickerComponent,
    CommonDaterangeComponent,
    CommonCheckbox,
    CommonRadioButton,
    CommonSlideToggle,
    CommonTimepickerComponent,
    PhotoUploadComponent,
    DocumentUploadComponent,
    ColorPickerComponent,
    StarRating,
    TextEditor
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss'
})
export class DynamicFormComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChildren('actionButtonBlock') actionButtonBlockElemRefs!: QueryList<ElementRef<HTMLElement>>;
  @Input() formControls!: DynamicForm;
  @Input() showCard: boolean = true;

  form!: FormGroup;
  sectionViewControls = signal<{ originalSection: SectionControls; inputControls: DynamicFormControl[]; actionControls: DynamicFormControl[] }[]>([]);

  constructor(private controlContainer: ControlContainer) { }

  ngOnInit(): void {
    this.setControls();
    this.form = <FormGroup>this.controlContainer?.control;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.setControls();
  }

  ngAfterViewInit() {
    this.adjustButtonsAlignment();
    this.actionButtonBlockElemRefs.changes.subscribe(() => {
      this.adjustButtonsAlignment();
    });
  }

  @HostListener('window:resize')
  onResize = () => {
    this.adjustButtonsAlignment();
  }

  setControls = () => {
    const sections = this.formControls?.formSection ?? [];
    this.sectionViewControls.set(
      sections.map((section) => {
        const controls = section?.controls ?? [];
        return {
          originalSection: section,
          inputControls: controls.filter((con) => !con.isActionButton),
          actionControls: controls.filter((con) => con.isActionButton)
        };
      })
    );
  }

  convertInput = (control: DynamicFormControl) => {
    return control.control as CommonTextboxConfig;
  }

  convertDropdown = (control: DynamicFormControl) => {
    return control.control as CommonDropdownConfig;
  }

  convertDatePicker = (control: DynamicFormControl) => {
    return control.control as CommonDatepickerConfig;
  }

  convertDateRangePicker = (control: DynamicFormControl) => {
    return control.control as CommonDateRangeConfig;
  }

  convertCheckbox = (control: DynamicFormControl) => {
    return control.control as CommonCheckboxConfig;
  }

  convertRating = (control: DynamicFormControl) => {
    return control.control as StarRatingConfig;
  }

  // convertSingleCheckbox(control: DynamicFormControl) {
  //   return (control.control as CheckboxConfig)
  // }

  convertRadioButton = (control: DynamicFormControl) => {
    return control.control as CommonRadioButtonConfig;
  }

  // convertTextbox(control: DynamicFormControl) {
  //   return (control.control as AppTextarea)
  // }

  // convertHtmlEditor(control: DynamicFormControl) {
  //   return (control.control as AppFormFieldConfig)
  // }

  convertSlideToggle = (control: DynamicFormControl) => {
    return control.control as CommonSlideToggleConfig;
  }

  convertImageUpload = (control: DynamicFormControl) => {
    return control.control as CommonPhotoUploadConfig;
  }

  isHiddenSection = (section: SectionControls): boolean => {
    return section?.isHiddenSection?.() ?? false;
  }

  isHiddenField = (control: DynamicFormControl): boolean => {
    return control?.isHiddenField?.() ?? false;
  }

  convertTimepicker = (control: DynamicFormControl) => {
    return control.control as CommonTimepickerConfig;
  }

  convertDocumentUpload = (control: DynamicFormControl) => {
    return control.control as DocumentUploadConfig;
  }

  convertColorPicker = (control: DynamicFormControl) => {
    return control.control as CommonColorPickerConfig;
  }

  convertTextEditor = (control: DynamicFormControl) => {
    return control.control as CommonTextEditorConfig;
  }

  private adjustButtonsAlignment = () => {
    if (!this.actionButtonBlockElemRefs?.length) return;

    this.actionButtonBlockElemRefs.forEach((buttonElemRef) => {
      const buttons = buttonElemRef.nativeElement;
      const row = buttons.closest('.row') as HTMLElement;

      if (!row || !buttons) return;

      const firstCol = Array.from(row.children).find((c) => (c as HTMLElement).className.includes('col')) as HTMLElement;
      if (!firstCol) return;

      const firstTop = firstCol.offsetTop;
      const buttonTop = buttons.offsetTop;
      const diff = buttonTop - firstTop;
      const colHeight = firstCol.offsetHeight;

      if (diff >= colHeight) {
        // Wrapped, align right.
        buttons.style.marginLeft = 'auto';
        buttons.style.justifyContent = 'flex-end';
      } else {
        // Same row, align left.
        buttons.style.marginLeft = '0';
        buttons.style.justifyContent = 'flex-start';
        buttons.style.marginTop = '5px';
        buttons.style.height = '-webkit-fill-available';
      }
    });
  }
}
