import { Component, inject, DestroyRef, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { getSlideToggleConfig, getTextboxConfig, getDateRangeConfig, getDropdownConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { holidayStore, Holiday, HOLIDAY_CONST } from '../models/holiday.model';
import { API } from '../../../../../shared/constants/api-url';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { InputType } from '../../../../../shared/Enums/common.enum';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { HolidayHelperService } from '../../../../../core/services/holiday-helper.service';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { ITextValueOption } from '../../../../../shared/models/common.model';

@Component({
  selector: 'app-holiday-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, ButtonComponent],
  providers: [holidayStore],
  templateUrl: './holiday-form.html',
})
export class HolidayForm extends BaseFormComponent<Holiday> implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  protected override readonly store = inject(holidayStore);
  private readonly destroyRef = inject(DestroyRef);

  protected override disableActionsInPastAcademicYear = true;

  protected override getByIdEndpoint = API.ADMIN.CONFIGURATION.HOLIDAY.GET;
  protected override entityIdParamKey = 'holidayId';

  private readonly holidayHelperService = inject(HolidayHelperService);
  private readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly dropdownStore = inject(CommonDropdownStore);

  private readonly DROPDOWN_KEYS = {
    noticeGroupId: 'noticeGroupId',
  } as const;

  private originalHolidayDate: string | Date | null = null;
  private originalHolidayEndDate: string | Date | null = null;
  private noticeAudienceGroupOptions: ITextValueOption[] = [];

  protected override formGroup = this.fb.nonNullable.group({
    holidayId: this.fb.control(EMPTY_GUID),
    name: this.fb.control('', Validators.required),
    startDate: this.fb.control<any>(null, [
      Validators.required,
      (control) => this.holidayHelperService.duplicateHolidayValidator(
        () => this.originalHolidayDate,
        () => this.originalHolidayEndDate,
        () => this.formGroup?.get('endDate')?.value
      )(control)
    ]),
    endDate: this.fb.control<any>(null, Validators.required),
    holidayGroupId: this.fb.control<string | null>(null, Validators.required),
    description: this.fb.control(''),
    isActive: this.fb.control(true),
  });

  protected override formControls!: DynamicForm;

  constructor() {
    super();
    this.bindDropdownToControl('holidayGroupId', this.dropdownStore.getList(this.DROPDOWN_KEYS.noticeGroupId), (options) => {
      this.noticeAudienceGroupOptions = options;
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.formGroup.controls.endDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formGroup.controls.startDate.updateValueAndValidity({ emitEvent: false });
      });

    this.updateDateRangeDisableState(this.formGroup.controls.holidayGroupId.value);
  }

  private updateDateRangeDisableState = (groupId: string | null | undefined): void => {
    if (CommonHelper.isEmpty(groupId)) {
      this.formGroup.controls.startDate.disable();
      this.formGroup.controls.endDate.disable();
    } else {
      this.formGroup.controls.startDate.enable();
      this.formGroup.controls.endDate.enable();
    }
  };

  protected override loadData(): void {
    super.loadData();
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.noticeGroupId,
      endpoint: API.ADMIN.COMMUNICATION.NOTICE_AUDIANCE_GROUP.LIST_DROPDOWN,
      params: { isFromHoliday: true },
      force: true
    });
  }

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: getTextboxConfig(HOLIDAY_CONST.HOLIDAY_NAME, 'name', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getDropdownConfig(
                'holidayGroupId',
                HOLIDAY_CONST.TARGET_GROUP,
                this.noticeAudienceGroupOptions,
                null,
                null,
                (data: ITextValueOption) => {
                  const val = data ? String(data.value) : null;
                  this.holidayHelperService.loadHolidays({
                    audienceGroupId: val
                  })
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe(() => {
                    this.formGroup.controls.startDate.updateValueAndValidity({ emitEvent: false });
                    this.cdr.markForCheck();
                  });
                  this.updateDateRangeDisableState(val);
                }
              ),
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                ...getDateRangeConfig(
                  'Holiday Duration',
                  'startDate',
                  'endDate',
                  'outline',
                  false,
                  'Start Date',
                  'End Date',
                  () => this.academicYearHelper.getDatepickerMinDate(),
                  () => this.academicYearHelper.getDatepickerMaxDate()
                ),
                disableCallBack: () => CommonHelper.isEmpty(this.formGroup.controls.holidayGroupId.value),
                filterDate: (date: Date | null) => {
                  if (!date) return true;
                  return !this.holidayHelperService.isDuplicateHoliday(
                    date,
                    this.originalHolidayDate,
                    this.originalHolidayEndDate
                  );
                }
              },
              type: DynamicFormControlType.DateRangePicker,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(HOLIDAY_CONST.DESCRIPTION, 'description', undefined, InputType.textarea, 'outline'),
              type: DynamicFormControlType.TextArea,
              class: 'col-12 col-md-6',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
          ],
        },
      ],
    };
  }

  protected override submitForm(): void {
    const payload = this.formGroup.getRawValue();
    this.store.create({
      endpoint: API.ADMIN.CONFIGURATION.HOLIDAY.ADDUPDATE,
      body: payload,
    });
  }

  protected override cancelRoute(): string[] {
    return ['admin', 'configuration', 'holidays'];
  }

  protected override patchForm(holiday: Holiday): void {
    this.originalHolidayDate = holiday.startDate;
    this.originalHolidayEndDate = holiday.endDate;
    this.formGroup.patchValue({
      holidayId: holiday.holidayId ?? EMPTY_GUID,
      name: holiday.name ?? '',
      startDate: CommonHelper.toDateOnly(holiday.startDate),
      endDate: CommonHelper.toDateOnly(holiday.endDate),
      holidayGroupId: holiday.holidayGroupId ?? null,
      description: holiday.description ?? '',
      isActive: holiday.isActive ?? true,
    }, { emitEvent: false });

    this.holidayHelperService.loadHolidays({
      audienceGroupId: holiday.holidayGroupId ?? null
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => {
      this.formGroup.controls.startDate.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    });

    this.updateDateRangeDisableState(holiday.holidayGroupId);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.holidayHelperService.clearHolidays();
    this.dropdownStore.resetState();
  }
}
