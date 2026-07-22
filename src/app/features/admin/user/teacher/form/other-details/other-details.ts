import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { REGEX_CONST } from '../../../../../../core/constants/regex.constant';
import { InputType } from '../../../../../../shared/Enums/common.enum';
import { getTextboxConfig } from '../../../../../../shared/functions/config-function';
import { DynamicFormComponent } from '../../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../../../shared/models/form-control-base.model';
import { API } from '../../../../../../shared/constants/api-url';
import {
  TeacherOtherDetails,
  teacherOtherDetailsStore,
} from '../../models/teacher-other-details.model';
import CommonHelper from '../../../../../../core/helpers/common-helper';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import { FormUtils } from '../../../../../../core/helpers/form-utils';
import { EMPTY_GUID } from '../../../../../../shared/constants/app.constants';

@Component({
  selector: 'app-teacher-other-details',
  standalone: true,
  imports: [DynamicFormComponent, ReactiveFormsModule, MatButtonModule],
  providers: [teacherOtherDetailsStore],
  templateUrl: './other-details.html',
  styleUrl: './other-details.scss',
})
export class OtherDetails implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  readonly otherDetailsStore = inject(teacherOtherDetailsStore);

  private readonly teacherId = signal<string | null>(EMPTY_GUID);
  readonly canPersist = computed(() => !CommonHelper.isEmpty(this.teacherId()));

  formGroup = this.fb.group({
    teacherOtherDetailId: this.fb.control(EMPTY_GUID),
    teacherId: this.fb.control(EMPTY_GUID, Validators.required),
    bloodGroup: this.fb.control(null),
    height: this.fb.control(null, Validators.pattern(REGEX_CONST.HEIGHT_WEIGHT)),
    weight: this.fb.control(null, Validators.pattern(REGEX_CONST.HEIGHT_WEIGHT)),
    bankAccountNumber: this.fb.control(null, Validators.pattern(REGEX_CONST.ALPHANUMERIC)),
    bankName: this.fb.control(null, FormUtils.onlyString),
    ifscCode: this.fb.control(null, Validators.pattern(REGEX_CONST.ALPHANUMERIC)),
    nationalIdentificationNumber: this.fb.control(null, Validators.pattern(REGEX_CONST.DIGIT)),
    previousSchoolName: this.fb.control(null, FormUtils.onlyString),
    previousSchoolAddress: this.fb.control(null),
    isActive: this.fb.control(true),
  });

  formControls!: DynamicForm;

  constructor() {
    effect(() => {
      const data = this.otherDetailsStore.data();
      if (!data) return;
      if (data.teacherId && data.teacherId !== this.teacherId()) return;
      this.patchForm(data);
    });
  }

  ngOnInit(): void {
    this.otherDetailsStore.resetState();
    const resolvedTeacherId = this.initializeTeacherContext();
    if (resolvedTeacherId) {
      this.teacherId.set(resolvedTeacherId);
    }
    this.buildFormControls();
    this.patchTeacherIdControl(resolvedTeacherId);

    this.loadOtherDetails(resolvedTeacherId);
  }

  onSave = (): void => {
    if (!this.formGroup.dirty || !this.canPersist() || this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.getRawValue();
    const payload: TeacherOtherDetails = {
      ...(formValue as TeacherOtherDetails),
      teacherId: this.teacherId(),
      height: CommonHelper.toNullableNumber(formValue.height),
      weight: CommonHelper.toNullableNumber(formValue.weight),
    };

    this.otherDetailsStore.create({
      endpoint: API.ADMIN.USER.TEACHER.ADDUPDATEOTHERDETAILS,
      body: payload,
    });
  };

  private initializeTeacherContext = (): string | null => {
    const teacherIdParam = this.route.snapshot.paramMap.get('teacherId');
    return CommonHelper.isEmpty(teacherIdParam) ? null : teacherIdParam;
  };

  private loadOtherDetails = (teacherId: string | null): void => {
    if (CommonHelper.isEmpty(teacherId)) return;
    this.otherDetailsStore.getById({
      endpoint: API.ADMIN.USER.TEACHER.OtherDetails,
      params: { teacherId },
    });
  };

  private buildFormControls = (): void => {
    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.MEDICAL,
          controls: [
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.MEDICAL.BLOOD_GROUP, 'bloodGroup', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.MEDICAL.HEIGHT, 'height', undefined, InputType.number, 'outline'),
              type: DynamicFormControlType.Number,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.MEDICAL.WEIGHT, 'weight', undefined, InputType.number, 'outline'),
              type: DynamicFormControlType.Number,
              class: 'col-12 col-md-4',
            },
          ],
        },
        {
          title: SYSTEM_CONST.SECTIONS.BANK,
          controls: [
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.BANK.ACCOUNT_NUMBER, 'bankAccountNumber', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.BANK.BANK_NAME, 'bankName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.BANK.IFSC_CODE, 'ifscCode', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.BANK.NATIONAL_ID, 'nationalIdentificationNumber', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
          ],
        },
        {
          title: SYSTEM_CONST.SECTIONS.PREVIOUS_SCHOOL,
          controls: [
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.SCHOOL.PREVIOUS_NAME, 'previousSchoolName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.SCHOOL.PREVIOUS_ADDRESS, 'previousSchoolAddress', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
          ]
        },
      ],
    };
  };

  private patchForm = (details: TeacherOtherDetails): void => {
    this.formGroup.patchValue({
      ...details,
      teacherOtherDetailId: CommonHelper.resolveId(details.teacherOtherDetailId),
      height: CommonHelper.toNullableNumber(details.height),
      weight: CommonHelper.toNullableNumber(details.weight),
      teacherId: CommonHelper.resolveId(this.teacherId())
    }, { emitEvent: false });
  };

  private patchTeacherIdControl = (teacherId: string | null): void => {
    if (CommonHelper.isEmpty(teacherId)) return;
    this.formGroup.patchValue({ teacherId: CommonHelper.resolveId(teacherId) }, { emitEvent: false });
  };
}

