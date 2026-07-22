import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AuthStore } from '../../../../../core/store/auth.store';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { MergeDateTime } from '../../../../../core/helpers/datetime.helper';
import { FormUtils } from '../../../../../core/helpers/form-utils';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { HolidayHelperService } from '../../../../../core/services/holiday-helper.service';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { API } from '../../../../../shared/constants/api-url';
import { InputType } from '../../../../../shared/Enums/common.enum';
import {
  getButtonConfig,
  getDatePickerConfig,
  getDocumentUploadConfig,
  getDropdownConfig,
  getSlideToggleConfig,
  getTextboxConfig,
  getTimepickerConfig,
} from '../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { EventDto, EVENTS_CONST, eventStore } from '../models/events.model';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';

@Component({
  selector: 'app-events-form',
  imports: [ReactiveFormsModule, DynamicFormComponent, ButtonComponent, MatDialogModule],
  templateUrl: './events-form.html',
  styleUrl: './events-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
})
export class EventsForm extends BaseFormComponent<EventDto> implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly holidayHelperService = inject(HolidayHelperService);
  private readonly academicYearHelper = inject(AcademicYearHelperService);
  protected readonly dialogRef = inject(MatDialogRef<any>, { optional: true });
  private readonly dialogData = inject<any>(MAT_DIALOG_DATA, { optional: true });
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  protected override readonly store = inject(eventStore);
  protected override readonly getByIdEndpoint: string = API.ADMIN.CALENDAR.EVENTS.GET;
  protected override readonly entityIdParamKey = 'eventId';
  protected override disableActionsInPastAcademicYear = true;

  private readonly DROPDOWN_KEYS = {
    eventType: 'evtEventType',
    noticeGroupId: 'evtNoticeGroupId',
  } as const;

  private eventTypeOption: ITextValueOption[] = [];
  private noticeAudienceGroup: ITextValueOption[] = [];

  protected override formGroup = this.fb.group(
    {
      eventId: this.fb.control<string | null>(EMPTY_GUID),
      eventTitle: this.fb.control('', Validators.required),
      description: this.fb.control(''),
      eventTypeId: this.fb.control<string | null>(null, Validators.required),
      eventGroupId: this.fb.control<string | null>(null, Validators.required),
      startDate: this.fb.control<string | Date | null>(null, Validators.required),
      endDate: this.fb.control<string | Date | null>(null, Validators.required),
      startTime: this.fb.control<string | Date | null>(null),
      endTime: this.fb.control<string | Date | null>(null),
      isAllDay: this.fb.control(false),
      location: this.fb.control('', Validators.required),
      eventFile: this.fb.control(''),
      eventFileName: this.fb.control(''),
      isActive: this.fb.control(true),
    },
    {
      validators: [
        FormUtils.validateTimeRange('startTime', 'endTime'),
        FormUtils.validateFutureTimeIfToday('startDate', 'startTime', 'pastStartTime'),
      ],
    }
  );

  protected override formControls!: DynamicForm;
  private readonly isViewMode = signal(false);

  readonly closeBtnConfig = computed<CommonButtonConfig>(() => ({
    ...getButtonConfig(
      () => this.onCancel(),
      'icon',
      'basic',
      '',
      false,
      undefined,
      'close'
    ),
    cssClasses: ['action-btn', 'close-btn'],
    visibleCallback: () => !!this.dialogRef,
  }));

  public override onSave(): void {
    super.onSave();
  }

  public override onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      super.onCancel();
    }
  }

  constructor() {
    super();

    effect(() => {
      if (this.isSaveClicked() && this.store.isSuccess() && this.dialogRef) {
        this.dialogRef.close(true);
      }
    });

    this.bindDropdownToControl(
      'eventTypeId',
      this.dropdownStore.getList(this.DROPDOWN_KEYS.eventType),
      (options) => (this.eventTypeOption = options),
      () => this.buildFormControls()
    );

    this.bindDropdownToControl(
      'eventGroupId',
      this.dropdownStore.getList(this.DROPDOWN_KEYS.noticeGroupId),
      (options) => (this.noticeAudienceGroup = options),
      () => this.buildFormControls()
    );

    this.formGroup.get('isAllDay')?.valueChanges.subscribe(() => {
      this.updateTimeValidators();
      this.cd.markForCheck();
    });

    this.formGroup.get('startDate')?.valueChanges.subscribe(() => {
      this.cd.markForCheck();
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.isViewMode.set(!!this.dialogData?.isView);

    if (this.dialogData?.date) {
      this.formGroup.patchValue({
        startDate: this.dialogData.date,
        endDate: this.dialogData.date,
      });
    }

    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.eventType,
      endpoint: API.ADMIN.CALENDAR.EVENT_TYPES.DROPDOWN,
    });

    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEYS.noticeGroupId,
      endpoint: API.ADMIN.COMMUNICATION.NOTICE_AUDIANCE_GROUP.LIST_DROPDOWN,
    });

    this.updateTimeValidators();
    this.buildFormControls();
  }

  protected override resolveEditId(): string | null {
    if (this.dialogData?.id) return this.dialogData.id;
    return super.resolveEditId();
  }

  private updateTimeValidators(): void {
    const isAllDay = this.formGroup.get('isAllDay')?.value;
    const startTimeComp = this.formGroup.get('startTime');
    const endTimeComp = this.formGroup.get('endTime');

    if (isAllDay) {
      startTimeComp?.clearValidators();
      endTimeComp?.clearValidators();
    } else {
      startTimeComp?.setValidators(Validators.required);
      endTimeComp?.setValidators(Validators.required);
    }
    startTimeComp?.updateValueAndValidity({ emitEvent: false });
    endTimeComp?.updateValueAndValidity({ emitEvent: false });
  }

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          controls: [
            {
              control: getTextboxConfig(
                EVENTS_CONST.EVENT_TITLE,
                'eventTitle',
                undefined,
                InputType.text,
                'outline'
              ),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDropdownConfig('eventTypeId', EVENTS_CONST.EVENT_TYPE, this.eventTypeOption),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDropdownConfig(
                  'eventGroupId',
                  EVENTS_CONST.EVENT_GROUP,
                  this.noticeAudienceGroup,
                  null,
                  null,
                  (data: ITextValueOption) => {
                    if (data && data.value) {
                      this.holidayHelperService.loadHolidays({
                        audienceGroupId: String(data.value)
                      })
                        .pipe(takeUntilDestroyed(this.destroyRef))
                        .subscribe(() => {
                          this.formGroup.controls.startDate.updateValueAndValidity({ emitEvent: false });
                          this.formGroup.controls.endDate.updateValueAndValidity({ emitEvent: false });
                          this.cd.markForCheck();
                        });
                    }
                  }
                ),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },
            {
              control: getTextboxConfig(
                EVENTS_CONST.LOCATION,
                'location',
                undefined,
                InputType.text,
                'outline'
              ),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDatePickerConfig(
                  'startDate',
                  SYSTEM_CONST.LABELS.COMMON.START_DATE,
                  'outline',
                  undefined,
                  () => this.academicYearHelper.getDatepickerMinDate(),
                  () => this.academicYearHelper.getDatepickerMaxDate()
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
                  'outline',
                  undefined,
                  () => {
                    const startDate = this.formGroup.get('startDate')?.value;
                    if (startDate) {
                      const d = new Date(startDate);
                      d.setHours(0, 0, 0, 0);
                      return d;
                    }
                    return this.academicYearHelper.getDatepickerMinDate();
                  },
                  () => this.academicYearHelper.getDatepickerMaxDate()
                ),
                getWarning: (value: string | null) => this.holidayHelperService.getWarning(value)
              },
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-4',
            },
            {
              control: getTimepickerConfig(
                'startTime',
                SYSTEM_CONST.LABELS.COMMON.START_TIME
              ),
              type: DynamicFormControlType.Timepicker,
              class: 'col-12 col-md-4',
              isHiddenField: () => !!this.formGroup.get('isAllDay')?.value,
            },
            {
              control: getTimepickerConfig('endTime', SYSTEM_CONST.LABELS.COMMON.END_TIME),
              type: DynamicFormControlType.Timepicker,
              class: 'col-12 col-md-4',
              isHiddenField: () => !!this.formGroup.get('isAllDay')?.value,
            },
            {
              control: getTextboxConfig(
                EVENTS_CONST.DESCRIPTION,
                'description',
                undefined,
                InputType.text,
                'outline'
              ),
              type: DynamicFormControlType.TextArea,
              class: 'col-12',
            },
            {
              control: getDocumentUploadConfig(
                'eventFile',
                EVENTS_CONST.EVENT_FILE,
                ['.pdf', '.png', '.jpg', '.jpeg'],
                false,
                SYSTEM_CONST.LABELS.FILE_UPLOAD.UPLOAD_FILE,
                API.ADMIN.CALENDAR.EVENTS.BASE64,
                'eventId',
                'eventFileName'
              ),
              type: DynamicFormControlType.DocumentUpload,
              class: 'col-12 col-md-6',
            },
            {
              control: getSlideToggleConfig('isAllDay', EVENTS_CONST.IS_ALL_DAY),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-md-3',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-md-3',
            },
          ],
        },
      ],
    };

    if (this.isEditMode()) {
      FormUtils.disableDynamicFormFields(this.formGroup, this.formControls, ['eventGroupId']);
    }
  }

  protected override patchForm(data: EventDto): void {
    this.formGroup.patchValue({
      eventId: data.eventId,
      eventTitle: data.eventTitle ?? '',
      description: data.description ?? '',
      eventTypeId: data.eventTypeId,
      eventGroupId: data.eventGroupId,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.isAllDay ? null : new Date(data.startDate),
      endTime: data.isAllDay ? null : new Date(data.endDate),
      isAllDay: data.isAllDay ?? false,
      location: data.location ?? '',
      eventFile: data.eventFile ?? null,
      eventFileName: data.eventFileName ?? null,
      isActive: data.isActive ?? true,
    });

    if (this.isViewMode()) {
      this.formGroup.disable();
    }

    if (data.eventGroupId) {
      this.holidayHelperService.loadHolidays({
        audienceGroupId: String(data.eventGroupId)
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formGroup.controls.startDate.updateValueAndValidity({ emitEvent: false });
        this.formGroup.controls.endDate.updateValueAndValidity({ emitEvent: false });
        this.cd.markForCheck();
      });
    }

    this.updateTimeValidators();
    this.cd.markForCheck();
  }

  protected override submitForm(): void {
    const rawVal = this.formGroup.getRawValue();
    const body: any = {
      ...rawVal,
      isHoliday: false,
      isExam: false,
      startDate: rawVal.isAllDay
        ? (rawVal.startDate as any)
        : MergeDateTime(rawVal.startDate as any, rawVal.startTime),
      endDate: rawVal.isAllDay
        ? (rawVal.endDate as any)
        : MergeDateTime(rawVal.endDate as any, rawVal.endTime),
    };

    this.store.create({
      endpoint: API.ADMIN.CALENDAR.EVENTS.ADDUPDATE,
      body: body,
    });
  }

  protected override cancelRoute(): string[] {
    return ['admin', 'calendar', 'events'];
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.holidayHelperService.clearHolidays();
  }
}
