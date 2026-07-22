import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormUtils } from '../../../../../core/helpers/form-utils';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getButtonConfig, getSlideToggleConfig, getTextboxConfig, getTimepickerConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { Timeslot, TIMESLOT_CONST, timeslotStore } from '../../../../common/timetable/time-slot/models/timeslot.model';
import { FormatTimeForApi, ParseTimeToDate } from '../../../../../core/helpers/datetime.helper';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';

@Component({
  selector: 'app-timeslot-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, ButtonComponent],
  providers: [timeslotStore],
  templateUrl: './timeslot-form.html',
})
export class TimeslotForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly commonHelperService = inject(CommonHelperService);
  readonly timeslotStore = inject(timeslotStore);

  private readonly editTimeslotId = signal<string | null>(null);
  readonly isEditMode = computed(() => !CommonHelper.isEmpty(this.editTimeslotId()));
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
    timeSlotId: this.fb.control<string | null>(EMPTY_GUID),
    startTime: this.fb.control<Date | null>(null, Validators.required),
    endTime: this.fb.control<Date | null>(null, Validators.required),
    slotName: this.fb.control('', Validators.required),
    name: this.fb.control('', [Validators.required, FormUtils.onlyString]),
    isBreak: this.fb.control(false),
    isActive: this.fb.control(true),
  }, {
    validators: [
      FormUtils.validateTimeRange('startTime', 'endTime'),
    ],
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
      if (this.isSaveClicked() && this.timeslotStore.isSuccess()) {
        this.onCancel();
      }
    });

    effect(() => {
      if (!this.isEditMode()) return;
      const timeslotData = this.timeslotStore.data();
      if (!timeslotData) return;
      this.patchForm(timeslotData);
    });
  }

  ngOnInit(): void {
    this.timeslotStore.resetState();
    this.resolveEditMode();
    this.buildFormControls();
  }

  onSave = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.isSaveClicked.set(true);
    const payload = this.buildPayload();
    this.timeslotStore.create({
      endpoint: API.ADMIN.CONFIGURATION.TIMESLOT.ADDUPDATE,
      body: payload,
    });
  };

  onCancel = (): void => {
    this.router.navigate(['admin', 'timetable', 'time-slots']);
  };

  private resolveEditMode = (): void => {
    const timeslotIdParam = this.route.snapshot.paramMap.get('timeSlotId');
    if (CommonHelper.isEmpty(timeslotIdParam)) return;

    this.editTimeslotId.set(timeslotIdParam);
    this.timeslotStore.getById({
      endpoint: API.ADMIN.CONFIGURATION.TIMESLOT.GET,
      params: { timeSlotId: timeslotIdParam },
    });
  };

  private patchForm = (timeslot: Timeslot): void => {
    const { startTime, endTime, ...rest } = timeslot;
    this.formGroup.patchValue({
      ...rest,
      startTime: ParseTimeToDate(startTime),
      endTime: ParseTimeToDate(endTime),
    });
  };

  private buildFormControls = (): void => {
    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: getTimepickerConfig(
                'startTime',
                SYSTEM_CONST.LABELS.COMMON.START_TIME,
              ),
              type: DynamicFormControlType.Timepicker,
              class: 'col-12 col-md-6',
            },
            {
              control: getTimepickerConfig(
                'endTime',
                SYSTEM_CONST.LABELS.COMMON.END_TIME,
              ),
              type: DynamicFormControlType.Timepicker,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(TIMESLOT_CONST.SLOT_NAME, 'slotName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(SYSTEM_CONST.LABELS.COMMON.NAME, 'name', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getSlideToggleConfig('isBreak', TIMESLOT_CONST.IS_BREAK),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-6 col-xl-6',
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

  private buildPayload = (): Timeslot => {
    const raw = this.formGroup.getRawValue();
    return {
      timeSlotId: CommonHelper.resolveId(raw.timeSlotId),
      startTime: FormatTimeForApi(raw.startTime),
      endTime: FormatTimeForApi(raw.endTime),
      slotName: raw.slotName ?? '',
      name: raw.name ?? '',
      isBreak: raw.isBreak ?? false,
      isActive: raw.isActive ?? true,
    };
  };
}
