import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ConfirmationService } from '../../../../../shared/services/dialog.service';
import { getButtonConfig, getSlideToggleConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { academicYearStore, AcademicYear, ACADEMIC_YEAR_CONST } from '../models/academic-year.model';
import { API } from '../../../../../shared/constants/api-url';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { InputType } from '../../../../../shared/Enums/common.enum';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';

@UntilDestroy()
@Component({
  selector: 'app-academic-year-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, ButtonComponent],
  providers: [academicYearStore],
  templateUrl: './academic-year-form.html',
})
export class AcademicYearForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly confirmService = inject(ConfirmationService);
  readonly academicYearStore = inject(academicYearStore);

  private readonly editAcademicYearId = signal<string | null>(null);
  private initialIsCurrentAcademicYear?: boolean;
  readonly isEditMode = computed(() => this.editAcademicYearId() !== null);
  readonly isSaveClicked = signal<boolean>(false);
  permission = computed(() => this.commonHelperService.getPermissionByPage());
  saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onSave(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.SAVE, true),
    cssClasses: ['btn', 'primary-btn'],
  });
  cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false),
    cssClasses: ['btn', 'secondary-btn'],
  });

  formGroup = this.fb.nonNullable.group({
    academicYearId: this.fb.control(EMPTY_GUID),
    academicYearName: this.fb.control('', Validators.required),
    academicYearCode: this.fb.control('', Validators.required),
    startDate: this.fb.control<any>(null, Validators.required),
    endDate: this.fb.control<any>(null, Validators.required),
    isActive: this.fb.control(true),
    isCurrentAcademicYear: this.fb.control(false),
  });

  formControls!: DynamicForm;

  constructor() {
    effect(() => {
      const p = this.permission();
      if (this.isEditMode()) {
        if (!p.canView && !p.canUpdate) this.onCancel();
        if (!p.canUpdate) this.formGroup.disable();
      } else {
        if (!p.canCreate) this.onCancel();
      }
    });
    effect(() => {
      if (this.isSaveClicked() && this.academicYearStore.isSuccess()) {
        this.onCancel();
      }
    });

    effect(() => {
      if (!this.isEditMode()) return;
      const academicYearData = this.academicYearStore.data();
      if (!academicYearData) return;
      this.patchForm(academicYearData);
    });
  }

  ngOnInit(): void {
    this.academicYearStore.resetState();
    this.resolveEditMode();

    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: getTextboxConfig(ACADEMIC_YEAR_CONST.ACADEMIC_YEAR_NAME, 'academicYearName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(ACADEMIC_YEAR_CONST.ACADEMIC_YEAR_CODE, 'academicYearCode', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                formControlName: 'startDate',
                label: SYSTEM_CONST.LABELS.COMMON.START_DATE,
                isFloatLabel: false,
                min: () => CommonHelper.getDateByYear(100),
                max: () => CommonHelper.getmaxDateByYear(3),
              },
              type: DynamicFormControlType.Datepicker,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
            {
              control: {
                formControlName: 'endDate',
                label: SYSTEM_CONST.LABELS.COMMON.END_DATE,
                isFloatLabel: false,
                min: () => CommonHelper.getDateByYear(100),
                max: () => CommonHelper.getmaxDateByYear(3),
              },
              type: DynamicFormControlType.Datepicker,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
            {
              control: getSlideToggleConfig('isCurrentAcademicYear', ACADEMIC_YEAR_CONST.IS_CURRENT_ACADEMIC_YEAR),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
          ],
        },
      ],
    };
  }

  onSave = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const rawValue = this.formGroup.getRawValue();
    const payload = rawValue;

    if (payload.isCurrentAcademicYear && !payload.isActive) {
      this.confirmService.confirm({
        title: ACADEMIC_YEAR_CONST.VALIDATION_ERROR,
        message: ACADEMIC_YEAR_CONST.CURRENT_CANNOT_BE_INACTIVE,
        confirmText: SYSTEM_CONST.ACTION_BUTTONS.OK,
        cancelText: SYSTEM_CONST.ACTION_BUTTONS.CLOSE,
      }).pipe(untilDestroyed(this)).subscribe();
      return;
    }

    if (this.initialIsCurrentAcademicYear && !payload.isCurrentAcademicYear) {
      this.confirmService.confirm({
        title: ACADEMIC_YEAR_CONST.VALIDATION_ERROR,
        message: ACADEMIC_YEAR_CONST.CURRENT_CANNOT_BE_REMOVED,
        confirmText: SYSTEM_CONST.ACTION_BUTTONS.OK,
        cancelText: SYSTEM_CONST.ACTION_BUTTONS.CLOSE,
      }).pipe(untilDestroyed(this)).subscribe();
      return;
    }

    if (payload.isCurrentAcademicYear && !this.initialIsCurrentAcademicYear) {
      this.confirmService.confirm({
        title: ACADEMIC_YEAR_CONST.SET_AS_CURRENT,
        message: ACADEMIC_YEAR_CONST.CONFIRM_SET_AS_CURRENT(payload.academicYearName),
        confirmText: ACADEMIC_YEAR_CONST.SET_AS_CURRENT,
        cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
      }).pipe(untilDestroyed(this)).subscribe(confirmed => {
        if (!confirmed) {
          return;
        }
        this.executeSave(payload);
      });
    } else {
      this.executeSave(payload);
    }
  };

  private executeSave(payload: any): void {
    this.isSaveClicked.set(true);
    this.academicYearStore.create({
      endpoint: API.ADMIN.CONFIGURATION.ACADEMIC_YEAR.ADDUPDATE,
      body: payload,
    });
  }

  onCancel = (): void => {
    this.router.navigate(['admin', 'configuration', 'academic-years']);
  };

  private resolveEditMode = (): void => {
    const academicYearIdParam = this.route.snapshot.paramMap.get('academicYearId');
    if (CommonHelper.isEmpty(academicYearIdParam)) return;

    this.editAcademicYearId.set(academicYearIdParam);

    this.academicYearStore.getById({
      endpoint: API.ADMIN.CONFIGURATION.ACADEMIC_YEAR.GET,
      params: { academicYearId: academicYearIdParam },
    });
  };

  private patchForm = (academicYear: AcademicYear): void => {
    this.initialIsCurrentAcademicYear = academicYear.isCurrentAcademicYear;
    this.formGroup.patchValue({
      academicYearId: CommonHelper.resolveId(academicYear.academicYearId),
      academicYearName: academicYear.academicYearName ?? '',
      academicYearCode: academicYear.academicYearCode ?? '',
      startDate: CommonHelper.toDateOnly(academicYear.startDate),
      endDate: CommonHelper.toDateOnly(academicYear.endDate),
      isActive: academicYear.isActive ?? true,
      isCurrentAcademicYear: academicYear.isCurrentAcademicYear ?? false,
    });
  };
}
