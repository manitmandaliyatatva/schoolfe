import { Component, ElementRef, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { REGEX_CONST } from '../../../../../../../core/constants/regex.constant';
import { SYSTEM_CONST } from '../../../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../../../core/helpers/common-helper';
import moment from 'moment';
import { CommonHelperService } from '../../../../../../../core/services/common-helper.service';
import { ButtonComponent } from '../../../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../../../shared/components/button/model/button.model';
import { DynamicFormComponent } from '../../../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { EMPTY_GUID } from '../../../../../../../shared/constants/app.constants';
import { InputType } from '../../../../../../../shared/Enums/common.enum';
import { getButtonConfig, getTextboxConfig, getSlideToggleConfig, getDatePickerConfig } from '../../../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../../../shared/models/form-control-base.model';
import { AddEditTeacherQualificationDialogData, TeacherQualification, TEACHER_CONST } from '../../../models/teacher.model';

@Component({
  selector: 'app-add-edit-qualifications-dialog',
  imports: [ReactiveFormsModule, DynamicFormComponent, ButtonComponent],
  templateUrl: './add-edit-qualifications-dialog.html',
})
export class AddEditQualificationsDialog implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<any, boolean>);
  private readonly dialogData = inject<AddEditTeacherQualificationDialogData>(MAT_DIALOG_DATA);
  readonly commonHelperService = inject(CommonHelperService);

  private passingYearValidator = (control: AbstractControl) => {
    if (!control.value) return null;
    
    const year = CommonHelper.getYearString(control.value);

    if (!REGEX_CONST.DIGIT.test(year) || year.length !== 4) {
      return { invalidYear: TEACHER_CONST.YEAR_ONLY };
    }

    return null;
  };

  formGroup = this.fb.group({
    teacherQualificationId: this.fb.control<string | null>(EMPTY_GUID),
    teacherId: this.fb.control<string | null>(EMPTY_GUID),
    qualification: this.fb.control(null, [Validators.required, Validators.maxLength(100)]),
    passingYear: this.fb.control(null, [
      Validators.required,
      this.passingYearValidator
    ]),
    institutionName: this.fb.control(null, [Validators.required, Validators.maxLength(200)]),
    universityName: this.fb.control(null, [Validators.required, Validators.maxLength(200)]),
    isPercentage: this.fb.control(true),
    marks: this.fb.control(null, [Validators.required, Validators.min(0)]),
  });

  formControls!: DynamicForm;
  readonly isAddMode = signal(true);

  readonly saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onSave(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.SAVE, true),
    cssClasses: ['btn', 'primary-btn'],
  });

  readonly cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false),
    cssClasses: ['btn', 'secondary-btn'],
  });

  ngOnInit(): void {
    this.setFormControls();
    const incomingQualification = this.data.qualification;
    const isEditMode = !!incomingQualification && !CommonHelper.isEmpty(incomingQualification.teacherQualificationId);
    this.isAddMode.set(!isEditMode);

    if (incomingQualification) {
      this.formGroup.patchValue({
        ...incomingQualification,
        teacherId: CommonHelper.resolveId(this.data.teacherId || incomingQualification.teacherId),
        teacherQualificationId: CommonHelper.resolveId(incomingQualification.teacherQualificationId),
      }, { emitEvent: false });
      this.formGroup.markAsPristine();
    } else {
      this.formGroup.patchValue({
        teacherId: CommonHelper.resolveId(this.data.teacherId),
        teacherQualificationId: CommonHelper.resolveId(null),
      }, { emitEvent: false });
      this.formGroup.markAsPristine();
    }
  }

  onSave = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.commonHelperService.scrollToInvalidController(this.elementRef.nativeElement.parentElement);
      return;
    }

    const formValue = this.formGroup.getRawValue();
    const payload: TeacherQualification = {
      ...formValue,
      teacherId: CommonHelper.resolveId(this.data.teacherId ?? formValue.teacherId),
      teacherQualificationId: CommonHelper.resolveId(formValue.teacherQualificationId),
      marks: CommonHelper.toNullableNumber(formValue.marks) || 0,
    } as TeacherQualification;

    this.data.onSave?.(payload);
    this.dialogRef.close(true);
  };

  onCancel = (): void => {
    this.dialogRef.close(false);
  };

  private get data(): AddEditTeacherQualificationDialogData {
    return this.dialogData ?? { teacherId: null, qualification: null };
  }

  private setFormControls = (): void => {
    const isPercentage = this.formGroup.controls.isPercentage.value;
    
    if (isPercentage)
      this.formGroup.controls.marks.clearValidators();
    else
      this.formGroup.controls.marks.setValidators([Validators.required, Validators.min(0), Validators.max(10)]);
    
    this.formControls = {
      formSection: [
        {
          title: '',
          controls: [
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.QUALIFICATION.QUALIFICATION, 'qualification'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                ...getDatePickerConfig(
                  'passingYear',
                  SYSTEM_CONST.LABELS.QUALIFICATION.PASSING_YEAR,
                  undefined,
                  undefined,
                  () => CommonHelper.getDateByYear(100),
                  () => CommonHelper.getDateByYear(0)
                ),
                mode: 'year'
              },
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.QUALIFICATION.INSTITUTION, 'institutionName'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.QUALIFICATION.UNIVERSITY, 'universityName'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getSlideToggleConfig('isPercentage', SYSTEM_CONST.LABELS.QUALIFICATION.IS_PERCENTAGE, 'after', null, () => {
                this.setFormControls();
              }),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(
                isPercentage ? SYSTEM_CONST.LABELS.QUALIFICATION.PERCENTAGE : SYSTEM_CONST.LABELS.QUALIFICATION.CGPA, 
                'marks', 
                undefined, 
                isPercentage ? InputType.percentage : InputType.number,
              ),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
          ],
        },
      ],
    };
  };
}
