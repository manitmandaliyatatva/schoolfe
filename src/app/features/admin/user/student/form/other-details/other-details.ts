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
  StudentOtherDetails,
  studentOtherDetailsStore,
} from '../../models/student-other-details.model';
import CommonHelper from '../../../../../../core/helpers/common-helper';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import { FormUtils } from '../../../../../../core/helpers/form-utils';
import { EMPTY_GUID } from '../../../../../../shared/constants/app.constants';

@Component({
  selector: 'app-other-details',
  imports: [DynamicFormComponent, ReactiveFormsModule, MatButtonModule],
  providers: [studentOtherDetailsStore],
  templateUrl: './other-details.html',
  styleUrl: './other-details.scss',
})
export class OtherDetails implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  readonly otherDetailsStore = inject(studentOtherDetailsStore);

  private readonly studentId = signal<string | null>(null);
  readonly canPersist = computed(() => !CommonHelper.isEmpty(this.studentId()));



  formGroup = this.fb.group({
    studentOtherDetailId: this.fb.control<string | null>(EMPTY_GUID),
    studentId: this.fb.control<string | null>(null, Validators.required),
    bloodGroup: this.fb.control(''),
    height: this.fb.control<number | null>(null, Validators.pattern(REGEX_CONST.HEIGHT_WEIGHT)),
    weight: this.fb.control<number | null>(null, Validators.pattern(REGEX_CONST.HEIGHT_WEIGHT)),
    bankAccountNumber: this.fb.control('', Validators.pattern(REGEX_CONST.ALPHANUMERIC)),
    bankName: this.fb.control('', FormUtils.onlyString),
    ifscCode: this.fb.control('', Validators.pattern(REGEX_CONST.ALPHANUMERIC)),
    nationalIdentificationNumber: this.fb.control('', Validators.pattern(REGEX_CONST.DIGIT)),
    previousSchoolName: this.fb.control('', FormUtils.onlyString),
    previousSchoolAddress: this.fb.control(''),
    isActive: this.fb.control(true),
  });

  formControls!: DynamicForm;

  constructor() {
    effect(() => {
      const data = this.otherDetailsStore.data();
      if (!data) return;
      const responseStudentId = data.studentId;
      if (!CommonHelper.isEmpty(responseStudentId) && responseStudentId !== this.studentId()) return;
      this.patchForm(data);
    });
  }

  ngOnInit(): void {
    this.otherDetailsStore.resetState();
    const resolvedStudentId = this.initializeStudentContext();
    this.buildFormControls();
    this.patchStudentIdControl(resolvedStudentId);

    this.loadOtherDetails(resolvedStudentId);
  }

  onSave = (): void => {
    if (!this.formGroup.dirty || !this.canPersist() || this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.getRawValue();
    const payload: StudentOtherDetails = {
      ...(formValue as StudentOtherDetails),
      studentId: this.studentId(),
      height: CommonHelper.toNullableNumber(formValue.height),
      weight: CommonHelper.toNullableNumber(formValue.weight),
    };

    this.otherDetailsStore.create({
      endpoint: API.ADMIN.USER.STUDENT.ADDUPDATEOTHERDETAILS,
      body: payload,
    });
  };

  private initializeStudentContext = (): string => {
    const studentIdParam = this.route.snapshot.paramMap.get('studentId');
    if (!studentIdParam) {
      this.studentId.set(null);
      return null;
    }

    this.studentId.set(studentIdParam);
    return studentIdParam;
  };

  private loadOtherDetails = (studentId: string): void => {
    if (CommonHelper.isEmpty(studentId)) return;
    this.otherDetailsStore.getById({
      endpoint: API.ADMIN.USER.STUDENT.OTHERDETAILS,
      params: { studentId },
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

  private patchForm = (details: StudentOtherDetails): void => {
    const routeStudentId = this.studentId();
    const resolvedStudentId = !CommonHelper.isEmpty(details.studentId) ? details.studentId : routeStudentId;

    this.formGroup.patchValue({
      studentOtherDetailId: CommonHelper.resolveId(details.studentOtherDetailId),
      studentId: CommonHelper.resolveId(resolvedStudentId),
      bloodGroup: details.bloodGroup ?? '',
      height: CommonHelper.toNullableNumber(details.height),
      weight: CommonHelper.toNullableNumber(details.weight),
      bankAccountNumber: details.bankAccountNumber ?? '',
      bankName: details.bankName ?? '',
      ifscCode: details.ifscCode ?? '',
      nationalIdentificationNumber: details.nationalIdentificationNumber ?? '',
      previousSchoolName: details.previousSchoolName ?? '',
      previousSchoolAddress: details.previousSchoolAddress ?? '',
      isActive: details.isActive ?? true,
    }, { emitEvent: false });
  };

  private patchStudentIdControl = (studentId: string): void => {
    if (CommonHelper.isEmpty(studentId)) return;
    this.formGroup.patchValue({ studentId: CommonHelper.resolveId(studentId) }, { emitEvent: false });
  };
}
