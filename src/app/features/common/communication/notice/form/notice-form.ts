import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { API } from '../../../../../shared/constants/api-url';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getTextboxConfig, getSlideToggleConfig, getDropdownConfig, getDatePickerConfig, getDocumentUploadConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { INotice, NOTICE, noticeStore } from '../model/notice.model';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ConfirmationService } from '../../../../../shared/services/dialog.service';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { AuthStore } from '../../../../../core/store/auth.store';
import { INoticeAudienceGroup } from '../../notice-audiance-group/model/notice-auduence-group.model';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { HolidayHelperService } from '../../../../../core/services/holiday-helper.service';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';

@UntilDestroy()
@Component({
  selector: 'common-notice-form',
  imports: [ReactiveFormsModule, ButtonComponent, DynamicFormComponent],
  providers: [noticeStore],
  templateUrl: './notice-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommonNoticeForm extends BaseFormComponent<INotice> implements OnDestroy {
  authStore = inject(AuthStore);
  private readonly holidayHelperService = inject(HolidayHelperService);
  private readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly confirmService = inject(ConfirmationService);
  private readonly DROPDOWN_KEYS = {
    noticeType: 'noticeType',
    noticeGroupId: 'noticeGroupId',
  } as const;

  private noticeTypeOption: ITextValueOption[] = [];
  private noticeAudienceGroup: ITextValueOption[] = [];

  private readonly fb = inject(FormBuilder);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected override formGroup: FormGroup<any> = this.fb.nonNullable.group({
    noticeId: this.fb.control<string | null>(EMPTY_GUID),
    title: this.fb.control('', Validators.required),
    description: this.fb.control('', Validators.required),
    noticeTypeId: this.fb.control('', Validators.required),
    noticeGroupId: this.fb.control(undefined, Validators.required),
    publishDate: this.fb.control('', Validators.required),
    expiryDate: this.fb.control('', Validators.required),
    noticeFile: this.fb.control(null),
    isActive: this.fb.control(true),
    isImportant: this.fb.control(false),
    attachmentFileName: this.fb.control(''),
    createdDate: this.fb.control('')
  });

  protected override formControls: DynamicForm;
  protected override store = inject(noticeStore);

  protected override getByIdEndpoint: string = API.ADMIN.COMMUNICATION.NOTICE.GET
  protected override entityIdParamKey: keyof INotice = 'noticeId';
  protected override disableActionsInPastAcademicYear = true;

  readonly dropdownStore = inject(CommonDropdownStore);
  readonly noticeAudienceGrpTypeDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.noticeGroupId);

  constructor() {
    super();
    this.bindDropdownToControl('noticeTypeId', this.dropdownStore.getList(this.DROPDOWN_KEYS.noticeType), (options) => {
      this.noticeTypeOption = options
    });
    this.bindDropdownToControl('noticeGroupId', this.dropdownStore.getList(this.DROPDOWN_KEYS.noticeGroupId), (options) => {
      this.noticeAudienceGroup = options
    });
  }

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          title: NOTICE.BASIC_INFORMATION,
          controls: [
            {
              control: getTextboxConfig(NOTICE.TITLE, 'title', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDatePickerConfig(
                  'publishDate',
                  NOTICE.PUBLISH_DATE,
                  undefined,
                  undefined,
                  () => this.isEditMode()
                    ? (CommonHelper.isPastDate(this.formGroup?.get('publishDate').value)
                      ? new Date(this.formGroup?.get('publishDate').value)
                      : this.academicYearHelper.getDatepickerMinDate())
                    : this.academicYearHelper.getDatepickerMinDate(),
                  () => this.isEditMode() ? CommonHelper.getmaxDateByYear(1, this.formGroup?.get('publishDate').value) : this.academicYearHelper.getDatepickerMaxDate()
                ),
                getWarning: (value: string | null) => this.holidayHelperService.getWarning(value)
              },
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDatePickerConfig(
                  'expiryDate',
                  NOTICE.EXPIRY_DATE,
                  undefined,
                  undefined,
                  () => {
                    const pub = this.formGroup?.get('publishDate')?.value;
                    const minDate = this.academicYearHelper.getDatepickerMinDate();
                    if (pub) {
                      const pubDate = new Date(pub);
                      pubDate.setHours(0, 0, 0, 0);
                      return pubDate > minDate ? pubDate : minDate;
                    }
                    return minDate;
                  },
                  () => this.isEditMode() ? CommonHelper.getmaxDateByYear(1, this.formGroup?.get('expiryDate').value) : this.academicYearHelper.getDatepickerMaxDate()
                ),
                getWarning: (value: string | null) => this.holidayHelperService.getWarning(value)
              },
              type: DynamicFormControlType.Datepicker,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDropdownConfig('noticeTypeId', NOTICE.NOTICE_TYPE, this.noticeTypeOption),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                ...getDropdownConfig('noticeGroupId', NOTICE.NOTICE_GROUP, this.noticeAudienceGroup, null, null, (data: ITextValueOption) => {
                  if (data && data.value) {
                    this.holidayHelperService.loadHolidays({
                      audienceGroupId: String(data.value)
                    })
                      .pipe(takeUntilDestroyed(this.destroyRef))
                      .subscribe(() => {
                        this.formGroup.controls['publishDate'].updateValueAndValidity({ emitEvent: false });
                        this.formGroup.controls['expiryDate'].updateValueAndValidity({ emitEvent: false });
                        this.cd.markForCheck();
                      });
                  }
                }),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(NOTICE.DESCRIPTION, 'description', undefined, InputType.textarea, 'outline'),
              type: DynamicFormControlType.TextArea,
              class: 'col-12 col-md-6',
            },
            {
              control: getDocumentUploadConfig(
                'noticeFile',
                SYSTEM_CONST.LABELS.DOCUMENTS.FILE,
                ['.pdf'],
                false,
                this.isEditMode() ? SYSTEM_CONST.LABELS.FILE_UPLOAD.CHANGE_FILE : SYSTEM_CONST.LABELS.FILE_UPLOAD.UPLOAD_FILE,
                API.ADMIN.COMMUNICATION.NOTICE.DOCUMENT_DOWNLOAD,
                'noticeId'
              ),
              type: DynamicFormControlType.DocumentUpload,
              class: 'col-12 col-md-6',
            },
            {
              control: getSlideToggleConfig('isImportant', NOTICE.IS_IMPORTANT),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-sm-6 col-md-3',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12 col-sm-6 col-md-3',
            },
          ],
        },
      ],
    };
  }

  protected override patchForm(data: INotice): void {
    this.formGroup.patchValue({
      ...data,
      description: data.description ?? null,
      isActive: data.isActive ?? true
    });
    if (data.noticeGroupId) {
      this.holidayHelperService.loadHolidays({
        audienceGroupId: String(data.noticeGroupId)
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.formGroup.controls['publishDate'].updateValueAndValidity({ emitEvent: false });
          this.formGroup.controls['expiryDate'].updateValueAndValidity({ emitEvent: false });
          this.cd.markForCheck();
        });
    }
    if (this.isEditMode()) {
      const isExpiryDateTodayOrPast = CommonHelper.isPastDate(data.expiryDate, true);
      const isPublishDateTodayOrPast = CommonHelper.isPastDate(data.publishDate, true);

      if (isExpiryDateTodayOrPast) {
        this.formGroup.disable();
      } else if (isPublishDateTodayOrPast) {
        this.formGroup.disable();
        this.formGroup.controls['expiryDate'].enable();
      }
    }

    this.cd.markForCheck();
  }
  override onSave = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const publishDateVal = this.formGroup.get('publishDate')?.value;
    const expiryDateVal = this.formGroup.get('expiryDate')?.value;

    if (publishDateVal) {
      const publishDate = new Date(publishDateVal);
      publishDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isPublishToday = publishDate.getTime() === today.getTime();

      let isExpiryToday = false;
      if (expiryDateVal) {
        const expiryDate = new Date(expiryDateVal);
        expiryDate.setHours(0, 0, 0, 0);
        isExpiryToday = expiryDate.getTime() === today.getTime();
      }

      if (isPublishToday) {
        const message = isExpiryToday
          ? NOTICE.CONFIRM_BOTH_TODAY
          : NOTICE.CONFIRM_PUBLISH_TODAY;

        this.confirmService
          .confirm({
            title: NOTICE.CONFIRM_SAVE,
            message: message,
            confirmText: SYSTEM_CONST.ACTION_BUTTONS.CONFIRM,
            cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
          })
          .pipe(untilDestroyed(this))
          .subscribe((confirmed) => {
            if (confirmed) {
              this.executeSave();
            }
          });
        return;
      }
    }

    this.executeSave();
  }

  private executeSave = (): void => {
    this.isSaveClicked.set(true);
    this.submitForm();
  }

  protected override submitForm = (): void => {
    const formValue = this.formGroup.getRawValue();
    const payload = formValue;
    this.store.create({
      endpoint: API.ADMIN.COMMUNICATION.NOTICE.ADDUPDATE,
      body: payload,
    });
  }
  protected override cancelRoute(): string[] {
    return [this.authStore.roleRoutePath(), 'communication', 'my-notices'];
  }

  protected override loadData(): void {
    super.loadData();
    this.dropdownStore.getDropdown<ITextValueOption[]>({
      key: this.DROPDOWN_KEYS.noticeType,
      endpoint: API.ADMIN.COMMUNICATION.NOTICE_TYPE.DROPDOWN,
    });
    this.dropdownStore.postDropdown<INoticeAudienceGroup>({
      key: this.DROPDOWN_KEYS.noticeGroupId,
      endpoint: API.ADMIN.COMMUNICATION.NOTICE_AUDIANCE_GROUP.LIST,
      mapData: (items: INoticeAudienceGroup[]) => items.map((item) => ({
        text: item.noticeGroupName,
        value: item.noticeGroupId,
      })),
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.holidayHelperService.clearHolidays();
    this.dropdownStore.resetState();
  }
}
