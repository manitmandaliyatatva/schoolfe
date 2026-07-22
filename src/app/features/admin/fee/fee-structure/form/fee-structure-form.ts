import { Component, inject, OnInit, OnDestroy, DestroyRef } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { API } from '../../../../../shared/constants/api-url';
import { getDatePickerConfig, getDropdownConfig, getSlideToggleConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { ConfirmationService } from '../../../../../shared/services/dialog.service';
import { FeeStructure, FeeStructureConst, feeStructureStore } from '../model/fee-structure.model';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { HolidayHelperService } from '../../../../../core/services/holiday-helper.service';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';

@UntilDestroy()
@Component({
  selector: 'app-fee-structure-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, ButtonComponent],
  templateUrl: './fee-structure-form.html',
})
export class FeeStructureForm extends BaseFormComponent<FeeStructure> implements OnInit, OnDestroy {
  private readonly DROPDOWN_KEYS = {
    classId: 'classList',
    feeTypeId: 'feeTypeList'
  } as const;
  private classOptions: ITextValueOption[] = [];
  private feeTypeOptions: ITextValueOption[] = [];
  private initialStartDate?: Date;
  private readonly confirmService = inject(ConfirmationService);
  initialPublished?: boolean;


  protected override formControls: DynamicForm;
  protected override store = inject(feeStructureStore);
  protected override getByIdEndpoint: string = API.ADMIN.FEE.FEE_STRUCTUER.GET;
  protected override entityIdParamKey: string = 'feeStructureId';
  protected override disableActionsInPastAcademicYear = true;
  private readonly holidayHelperService = inject(HolidayHelperService);
  private readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly fb = inject(FormBuilder);
  readonly dropdownStore = inject(CommonDropdownStore);
  readonly classDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.classId);

  constructor() {
    super();
    this.bindDropdownToControl('classId', this.classDropdownList, (options) => {
      this.classOptions = options;
    });
    this.bindDropdownToControl('feeTypeId', this.dropdownStore.getList(this.DROPDOWN_KEYS.feeTypeId), (options) => {
      this.feeTypeOptions = options;
    });
  }

  protected override loadData = (): void => {
    super.loadData();
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.classId,
      endpoint: API.CLASS.GET_CLASS_DROPDOWN,
    });
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.feeTypeId,
      endpoint: API.ADMIN.FEE.FEE_TYPE.DROPDOWN,
    });
  }

  public override formGroup = this.fb.nonNullable.group({
    feeStructureId: this.fb.control<string | null>(EMPTY_GUID),
    classId: this.fb.control(null, Validators.required),
    feeTypeId: this.fb.control(null, Validators.required),
    amount: this.fb.control(null, Validators.required),
    startDate: this.fb.control(null, Validators.required),
    endDate: this.fb.control(null, Validators.required),
    dueDate: this.fb.control(null, Validators.required),
    isPublished: this.fb.control(false),
    isActive: this.fb.control(true),
  });

  protected override buildFormControls = (): void => {
    const ctrl = this.formGroup.controls;
    this.formControls = {
      formSection: [
        {
          controls: [
            {
              control: {
                ...getDropdownConfig('classId', SYSTEM_CONST.LABELS.ACADEMIC.CLASS, this.classOptions, null, null, (data: ITextValueOption) => {
                  if (data && data.value) {
                    this.holidayHelperService.loadHolidays({
                      classId: String(data.value)
                    })
                      .pipe(takeUntilDestroyed(this.destroyRef))
                      .subscribe(() => {
                        this.formGroup.controls.startDate.updateValueAndValidity({ emitEvent: false });
                        this.formGroup.controls.endDate.updateValueAndValidity({ emitEvent: false });
                        this.formGroup.controls.dueDate.updateValueAndValidity({ emitEvent: false });
                        this.cdr.markForCheck();
                      });
                  }
                }),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDropdownConfig('feeTypeId', SYSTEM_CONST.LABELS.FEE.FEE_TYPE, this.feeTypeOptions),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.AMOUNT, 'amount', undefined, InputType.currency),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDatePickerConfig(
                  'startDate',
                  SYSTEM_CONST.LABELS.COMMON.START_DATE,
                  undefined,
                  undefined,
                  () => (this.isEditMode() && this.initialStartDate) ? this.initialStartDate : this.academicYearHelper.getDatepickerMinDate(),
                  () => this.academicYearHelper.getDatepickerMaxDate(),
                  () => {
                    ctrl.endDate.updateValueAndValidity();
                    ctrl.endDate.markAsTouched();
                    ctrl.dueDate.updateValueAndValidity();
                    ctrl.dueDate.markAsTouched();
                  }
                ),
                getWarning: (value: string | null) => this.holidayHelperService.getWarning(value)
              },
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDatePickerConfig(
                  'endDate',
                  SYSTEM_CONST.LABELS.COMMON.END_DATE,
                  undefined,
                  undefined,
                  () => this.getMinExtendableDate(ctrl.startDate?.value, this.academicYearHelper.getDatepickerMinDate()),
                  () => this.academicYearHelper.getDatepickerMaxDate(),
                  () => {
                    ctrl.dueDate.updateValueAndValidity();
                    ctrl.dueDate.markAsTouched();
                  }
                ),
                getWarning: (value: string | null) => this.holidayHelperService.getWarning(value)
              },
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDatePickerConfig(
                  'dueDate',
                  SYSTEM_CONST.LABELS.COMMON.DUE_DATE,
                  undefined,
                  undefined,
                  () => this.getMinExtendableDate(ctrl.startDate?.value, this.academicYearHelper.getDatepickerMinDate()),
                  () => ctrl.endDate?.value ? new Date(ctrl.endDate?.value) : this.academicYearHelper.getDatepickerMaxDate()
                ),
                getWarning: (value: string | null) => this.holidayHelperService.getWarning(value)
              },
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-4',
            },
            {
              control: getSlideToggleConfig('isPublished', SYSTEM_CONST.LABELS.COMMON.IS_PUBLISHED, 'after'),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-md-4',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE, 'after'),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-md-4',
            },
          ],
          title: SYSTEM_CONST.SECTIONS.FEE_STRUCTURE
        },
      ]
    }
  }

  protected override patchForm = (feeType: FeeStructure): void => {
    if (feeType.startDate) this.initialStartDate = new Date(feeType.startDate);
    this.initialPublished = feeType.isPublished;
    if (this.initialPublished) {
      this.formGroup.disable();

      const isEndDatePast = this.isInvalidPublishDate(feeType.endDate ?? null, true);
      if (!isEndDatePast) {
        this.formGroup.controls.endDate.enable();
      }

      const isDueDatePast = this.isInvalidPublishDate(feeType.dueDate ?? null, true);
      if (!isDueDatePast) {
        this.formGroup.controls.dueDate.enable();
      }

      this.formGroup.updateValueAndValidity();
    }
    
    this.formGroup.patchValue({
      ...feeType,
      feeStructureId: CommonHelper.resolveId(feeType.feeStructureId),
      classId: CommonHelper.resolveId(feeType.classId),
      feeTypeId: CommonHelper.resolveId(feeType.feeTypeId)
    });

    if (feeType.classId) {
      this.holidayHelperService.loadHolidays({
        classId: feeType.classId
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formGroup.controls.startDate.updateValueAndValidity({ emitEvent: false });
        this.formGroup.controls.endDate.updateValueAndValidity({ emitEvent: false });
        this.formGroup.controls.dueDate.updateValueAndValidity({ emitEvent: false });
        this.cdr.markForCheck();
      });
    }

  }

  override onSave = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    const formValue = this.formGroup.getRawValue();

    const isEndDatePast = this.isInvalidPublishDate(formValue.endDate, !!formValue.isPublished);
    const isDueDatePast = this.isInvalidPublishDate(formValue.dueDate, !!formValue.isPublished);

    const showEndDateError = isEndDatePast && (this.formGroup.controls.endDate.enabled || !this.initialPublished);
    const showDueDateError = isDueDatePast && (this.formGroup.controls.dueDate.enabled || !this.initialPublished);

    if (showEndDateError || showDueDateError) {
      this.confirmService.confirm({
        title: SYSTEM_CONST.ACTION_BUTTONS.PUBLISH,
        message: showEndDateError ? FeeStructureConst.END_DATE_PAST_ERROR : FeeStructureConst.DUE_DATE_PAST_ERROR,
        confirmText: SYSTEM_CONST.ACTION_BUTTONS.OK,
        cancelText: SYSTEM_CONST.ACTION_BUTTONS.CLOSE,
      }).pipe(untilDestroyed(this)).subscribe();
      return;
    }

    const payload: FeeStructure = {
      ...formValue,
    };

    if (payload.isPublished && !this.initialPublished) {
      this.confirmService.confirm({
        title: SYSTEM_CONST.ACTION_BUTTONS.PUBLISH,
        message: SYSTEM_CONST.ACTIONS.CONFIRM_PUBLISH(this.feeTypeOptions.find(x => x.value === payload.feeTypeId)?.text || ''),
        confirmText: SYSTEM_CONST.ACTION_BUTTONS.PUBLISH,
        cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
      }).pipe(untilDestroyed(this)).subscribe(confirmed => {
        if (!confirmed) {
          this.isSaveClicked.set(false);
          return;
        }
        this.isSaveClicked.set(true);
        this.store.create({
          endpoint: API.ADMIN.FEE.FEE_STRUCTUER.ADDUPDATE,
          body: payload
        })
      });
    } else {
      this.isSaveClicked.set(true);
      this.store.create({
        endpoint: API.ADMIN.FEE.FEE_STRUCTUER.ADDUPDATE,
        body: payload
      })
    }
  }

  protected override submitForm = (): void => { }

  protected override cancelRoute = (): string[] => {
    return ['admin', 'fee', 'fee-structures']
  }

  private isInvalidPublishDate = (date: Date | string | null, isPublished: boolean): boolean => {
    if (!isPublished || !date) return false;

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedDate.setHours(0, 0, 0, 0);

    return parsedDate < today;
  };

  private getMinExtendableDate = (startDateValue: any, currentDate: Date): Date => {
    const sDate = startDateValue ? new Date(startDateValue) : (this.isEditMode() && this.initialStartDate ? this.initialStartDate : currentDate);
    if (this.initialPublished) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return sDate < today ? today : sDate;
    }
    return sDate;
  };

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.holidayHelperService.clearHolidays();
    this.dropdownStore.resetState();
  }
}
