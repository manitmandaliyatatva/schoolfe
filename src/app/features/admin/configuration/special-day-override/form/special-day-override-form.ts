import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';
import { HolidayHelperService } from '../../../../../core/services/holiday-helper.service';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { API } from '../../../../../shared/constants/api-url';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { OverrideDayTypes } from '../../../../../shared/constants/holiday-type.constant';
import { LookupMnemonics } from '../../../../../shared/constants/lookup-type-ids.constant';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getDropdownConfig, getSlideToggleConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { SPECIAL_DAY_OVERRIDE_CONST, SpecialDayOverride, specialDayOverrideStore } from '../models/special-day-override.model';

@UntilDestroy()
@Component({
  selector: 'app-special-day-override-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, ButtonComponent],
  providers: [specialDayOverrideStore],
  templateUrl: './special-day-override-form.html',
})
export class SpecialDayOverrideForm extends BaseFormComponent<SpecialDayOverride> implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  protected override readonly store = inject(specialDayOverrideStore);
  private readonly holidayHelperService = inject(HolidayHelperService);
  private readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly dropdownStore = inject(CommonDropdownStore);

  protected override disableActionsInPastAcademicYear = true;

  private readonly DROPDOWN_KEYS = {
    dayType: 'specialDayOverrideDayType',
    noticeGroupId: 'noticeGroupId',
  } as const;

  readonly dayTypeDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.dayType);
  dayTypeOptions: ITextValueOption[] = [];
  noticeAudienceGroupOptions: ITextValueOption[] = [];

  constructor() {
    super();
    this.bindDropdownToControl('dayType', this.dayTypeDropdownList, (options) => {
      this.dayTypeOptions = options;
    });
    this.bindDropdownToControl('specialDayOverrideGroupId', this.dropdownStore.getList(this.DROPDOWN_KEYS.noticeGroupId), (options) => {
      this.noticeAudienceGroupOptions = options;
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.dayType,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.OverrideDayType },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: Number(item.value),
        mnemonic: item.mnemonic
      }))
    });

    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.noticeGroupId,
      endpoint: API.ADMIN.COMMUNICATION.NOTICE_AUDIANCE_GROUP.LIST_DROPDOWN,
      params: { isFromHoliday: true },
      force: true
    });

    this.updateDateDisableState(this.formGroup.controls.specialDayOverrideGroupId.value);
  }

  private updateDateDisableState = (groupId: string | null | undefined): void => {
    if (CommonHelper.isEmpty(groupId)) {
      this.formGroup.controls.overrideDate.disable();
    } else {
      this.formGroup.controls.overrideDate.enable();
    }
  };

  protected override getByIdEndpoint = API.ADMIN.CONFIGURATION.SPECIAL_DAY_OVERRIDE.GET;
  protected override entityIdParamKey = 'specialDayOverrideId';

  protected override formGroup = this.fb.nonNullable.group({
    specialDayOverrideId: this.fb.control(EMPTY_GUID),
    overrideDate: this.fb.control<any>(null, Validators.required),
    dayType: this.fb.control<any>(null, Validators.required),
    specialDayOverrideGroupId: this.fb.control<string | null>(null, Validators.required),
    reason: this.fb.control('', Validators.required),
    isActive: this.fb.control(true),
  });

  private originalOverrideDate: string | Date | null = null;
  protected override formControls!: DynamicForm;

  getOverrideWarning(value: string | null): string | null {
    if (!value) return null;

    const originalDate = this.originalOverrideDate ? CommonHelper.toDateOnly(this.originalOverrideDate) : null;
    const selectedDateStr = CommonHelper.toDateOnly(value);

    // If the user selected the same original date, no warning is needed
    if (originalDate === selectedDateStr) return null;

    const dayType = this.formGroup.get('dayType')?.value;
    const date = new Date(value);
    const status = this.holidayHelperService.checkHolidayStatus(value, originalDate);
    const isWeekOff = status.isWeekOff || this.holidayHelperService.excludeWeekdays().includes(date.getDay());
    const isHoliday = status.isHoliday;

    if (Number(dayType) === OverrideDayTypes["Weekly Off"]) {
      // Show warning only if dayType is Weekly Off and date is in holiday/weekend list
      if (isWeekOff || isHoliday) {
        return SPECIAL_DAY_OVERRIDE_CONST.WARNING_HOLIDAY;
      }
    } else if (Number(dayType) === OverrideDayTypes["Working Day"]) {
      // Show warning only if dayType is Working Day and date is already a working day (NOT week-off and NOT holiday)
      if (!isWeekOff && !isHoliday) {
        return SPECIAL_DAY_OVERRIDE_CONST.WARNING_WORKING_DAY;
      }
    }
    return null;
  }

  protected override buildFormControls(): void {
    this.formGroup.get('dayType')?.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.formGroup.get('overrideDate')?.updateValueAndValidity();
    });

    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: getDropdownConfig(
                'specialDayOverrideGroupId',
                SPECIAL_DAY_OVERRIDE_CONST.TARGET_GROUP,
                this.noticeAudienceGroupOptions,
                null,
                null,
                (data: ITextValueOption) => {
                  const val = data ? String(data.value) : null;
                  this.holidayHelperService.loadHolidays({
                    audienceGroupId: val
                  })
                  .pipe(untilDestroyed(this))
                  .subscribe(() => {
                    this.formGroup.controls.overrideDate.updateValueAndValidity({ emitEvent: false });
                    this.cdr.markForCheck();
                  });
                  this.updateDateDisableState(val);
                }
              ),
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                formControlName: 'overrideDate',
                label: SPECIAL_DAY_OVERRIDE_CONST.OVERRIDE_DATE,
                isFloatLabel: false,
                min: () => this.academicYearHelper.getDatepickerMinDate(),
                max: () => this.academicYearHelper.getDatepickerMaxDate(),
                getWarning: (value: string | null) => this.getOverrideWarning(value),
                disableCallBack: () => CommonHelper.isEmpty(this.formGroup.controls.specialDayOverrideGroupId.value)
              },
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-6',
            },
            {
              control: getDropdownConfig('dayType', SPECIAL_DAY_OVERRIDE_CONST.DAY_TYPE, this.dayTypeOptions),
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(SPECIAL_DAY_OVERRIDE_CONST.REASON, 'reason', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
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
      endpoint: API.ADMIN.CONFIGURATION.SPECIAL_DAY_OVERRIDE.ADDUPDATE,
      body: payload,
    });
  }

  protected override cancelRoute(): string[] {
    return ['admin', 'configuration', 'special-day-override'];
  }

  protected override patchForm(override: SpecialDayOverride): void {
    this.originalOverrideDate = override.overrideDate;
    this.formGroup.patchValue({
      specialDayOverrideId: override.specialDayOverrideId ?? EMPTY_GUID,
      overrideDate: CommonHelper.toDateOnly(override.overrideDate),
      dayType: override.dayType,
      specialDayOverrideGroupId: override.specialDayOverrideGroupId ?? null,
      reason: override.reason ?? '',
      isActive: override.isActive ?? true,
    });

    this.holidayHelperService.loadHolidays({
      audienceGroupId: override.specialDayOverrideGroupId ?? null
    })
    .pipe(untilDestroyed(this))
    .subscribe(() => {
      this.formGroup.controls.overrideDate.updateValueAndValidity({ emitEvent: false });
      this.cdr.markForCheck();
    });

    this.updateDateDisableState(override.specialDayOverrideGroupId);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.holidayHelperService.clearHolidays();
    this.dropdownStore.resetState();
  }
}
