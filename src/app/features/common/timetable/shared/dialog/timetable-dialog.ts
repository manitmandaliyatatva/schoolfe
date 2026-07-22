import { Component, computed, effect, inject, Injector, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { GenericDialog } from '../../../../../shared/components/generic-dialog/generic-dialog';
import { API } from '../../../../../shared/constants/api-url';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { LookupMnemonics } from '../../../../../shared/constants/lookup-type-ids.constant';
import {
  getButtonConfig,
  getDropdownConfig,
} from '../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DropdownOption } from '../../../../../shared/models/Dropdown.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { teacherTimetableStore } from '../../teacher-timetable/models/teacher-timetable.model';
import { TimetableRecord } from '../timetable-shared.model';
import {
  DropdownTimeslot,
  TIMETABLE_DIALOG_CONST,
  TimetableDialogData
} from './timetable-dialog.model';
import { AuthStore } from '../../../../../core/store/auth.store';

@Component({
  selector: 'app-timetable-dialog',
  imports: [DynamicFormComponent, ReactiveFormsModule, ButtonComponent],
  providers: [teacherTimetableStore],
  templateUrl: './timetable-dialog.html',
})
export class TimetableDialog implements OnInit, OnDestroy {
  private static readonly DROPDOWN_KEYS = {
    teacher: 'ttTeacher',
    classroom: 'ttClassroom',
    subject: 'ttSubject',
    timeSlot: 'ttTimeSlot',
    weekDay: 'ttWeekDay',
  } as const;

  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<GenericDialog, boolean>);
  private readonly injector = inject(Injector);
  readonly timetableStore = inject(teacherTimetableStore);
  readonly dropdownStore = inject(CommonDropdownStore);
  private readonly authStore = inject(AuthStore);

  readonly dialogData = this.injector.get<TimetableDialogData | null>('DIALOG_DATA', null);
  readonly source = computed(() => this.dialogData?.source ?? 'teacher');
  readonly isClassroomSource = computed(() => this.source() === 'classroom');
  readonly isEditMode = computed(() => !CommonHelper.isEmptyGuid(this.dialogData?.timeTableId));
  readonly isTeacherLocked = computed(
    () => this.source() === 'teacher' && !CommonHelper.isEmptyGuid(this.dialogData?.selectedTeacherId)
  );
  readonly isClassroomLocked = computed(
    () => this.source() === 'classroom' && !CommonHelper.isEmptyGuid(this.dialogData?.selectedClassSectionId)
  );
  readonly isWeekDayLocked = computed(
    () => this.isEditMode() || !CommonHelper.isEmpty(this.dialogData?.selectedWeekDayId)
  );
  readonly isTimeSlotLocked = computed(
    () => this.isEditMode() || !CommonHelper.isEmptyGuid(this.dialogData?.selectedTimeSlotId)
  );
  readonly isSaveClicked = signal<boolean>(false);
  private readonly isEditValuesSynced = signal<boolean>(false);
  private readonly timeSlotBreakMap = signal<Record<string, boolean>>({});
  private static lastLoadedStoreClassId: string | null = null;
  private currentIsActive = true;
  private lastLoadedClassId: string | null = null;
  readonly teacherDropdownList = this.dropdownStore.getList(TimetableDialog.DROPDOWN_KEYS.teacher);
  readonly classroomDropdownList = this.dropdownStore.getList(
    TimetableDialog.DROPDOWN_KEYS.classroom
  );
  readonly subjectDropdownList = this.dropdownStore.getList(TimetableDialog.DROPDOWN_KEYS.subject);
  readonly timeSlotDropdownList = this.dropdownStore.getList(
    TimetableDialog.DROPDOWN_KEYS.timeSlot
  );
  readonly weekDayDropdownList = this.dropdownStore.getList(
    TimetableDialog.DROPDOWN_KEYS.weekDay
  );

  saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onSave(), 'flat', 'primary', TIMETABLE_DIALOG_CONST.SAVE, true),
    cssClasses: ['btn', 'primary-btn'],
  });

  cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(
      () => this.onCancel(),
      'stroked',
      'basic',
      TIMETABLE_DIALOG_CONST.CANCEL,
      false
    ),
    cssClasses: ['btn', 'secondary-btn'],
  });

  formGroup = this.fb.nonNullable.group({
    timeTableId: this.fb.control<string | null>(EMPTY_GUID),
    classSectionId: this.fb.control<string | null>(null, Validators.required),
    weekDayId: this.fb.control<number | null>(null, Validators.required),
    timeSlotId: this.fb.control<string | null>(null, Validators.required),
    subjectId: this.fb.control<string | null>(null, Validators.required),
    teacherId: this.fb.control<string | null>(null, Validators.required),
  });

  formControls = computed<DynamicForm>(() => ({
    formSection: [
      {
        controls: [
          {
            control: getDropdownConfig(
              'teacherId',
              TIMETABLE_DIALOG_CONST.TEACHER,
              this.teacherDropdownList(),
              { isDisable: this.isTeacherLocked() }
            ),
            type: DynamicFormControlType.DropDown,
            class: 'col-12 col-md-6',
          },
          {
            control: getDropdownConfig(
              'weekDayId',
              TIMETABLE_DIALOG_CONST.WEEKDAY,
              this.weekDayDropdownList(),
              { isDisable: this.isWeekDayLocked() }
            ),
            type: DynamicFormControlType.DropDown,
            class: 'col-12 col-md-6',
          },
          {
            control: getDropdownConfig(
              'classSectionId',
              TIMETABLE_DIALOG_CONST.CLASSROOM,
              this.classroomDropdownList(),
              { isDisable: this.isClassroomLocked() },
              [],
              (data: any) => this.onClassSectionChange(data?.value)
            ),
            type: DynamicFormControlType.DropDown,
            class: 'col-12 col-md-6'
          },
          {
            control: getDropdownConfig(
              'subjectId',
              TIMETABLE_DIALOG_CONST.SUBJECT,
              this.subjectDropdownList()
            ),
            type: DynamicFormControlType.DropDown,
            class: 'col-12 col-md-6'
          },
          {
            control: getDropdownConfig(
              'timeSlotId',
              TIMETABLE_DIALOG_CONST.TIMESLOT,
              this.timeSlotDropdownList(),
              { isDisable: this.isTimeSlotLocked() }
            ),
            type: DynamicFormControlType.DropDown,
            class: 'col-12 col-md-6',
          },
        ],
      },
    ],
  }));


  constructor() {
    effect(() => {
      if (!this.isSaveClicked() || !this.timetableStore.isSuccess()) return;
      this.dialogRef.close(true);
    });

    effect(() => {
      const row = this.timetableStore.data();
      if (!this.isEditMode() || !row) return;
      this.isEditValuesSynced.set(false);
      this.loadSubjectsByClass(row.classSectionId);
      this.patchForm(row);
    });

    effect(() => {
      const options = this.teacherDropdownList();
      if (!this.isEditMode()) {
        this.patchTeacher(options);
      }
    });
    effect(() => {
      const options = this.classroomDropdownList();
      if (!this.isEditMode()) {
        this.patchClassroom(options);
      }
    });

    effect(() => {
      if (!this.isEditMode() || this.isEditValuesSynced()) return;
      const row = this.timetableStore.data();
      if (!row) return;

      const isBreakSlot = !!this.timeSlotBreakMap()[row.timeSlotId ?? null];
      const hideTeacherOnBreak = isBreakSlot && this.isClassroomSource();
      const hideClassroomOnBreak = isBreakSlot && !this.isClassroomSource();
      const hideSubjectOnBreak = isBreakSlot;

      const hasTeacher =
        hideTeacherOnBreak || this.hasOption(this.teacherDropdownList(), row.teacherId);
      const hasClassroom =
        hideClassroomOnBreak || this.hasOption(this.classroomDropdownList(), row.classSectionId);
      const hasSubject =
        hideSubjectOnBreak || this.hasOption(this.subjectDropdownList(), row.subjectId);
      const hasTimeslot = this.hasOption(this.timeSlotDropdownList(), row.timeSlotId);

      if (!(hasTeacher && hasClassroom && hasSubject && hasTimeslot)) return;
      this.patchForm(row);
      this.isEditValuesSynced.set(true);
    });
  }

  ngOnInit(): void {
    this.timetableStore.resetState();
    this.isEditValuesSynced.set(false);
    this.patchPreselectedSlotContext();
    this.loadDropdownOptions(this.dialogData?.selectedClassSectionId);
    this.resolveEditMode();
  }

  onSave = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const raw = this.formGroup.getRawValue();
    const payload: TimetableRecord = {
      timeTableId: CommonHelper.resolveId(raw.timeTableId),
      classSectionId: raw.classSectionId ?? null,
      weekDayId: raw.weekDayId ?? 0,
      timeSlotId: raw.timeSlotId ?? null,
      subjectId: raw.subjectId ?? null,
      teacherId: raw.teacherId ?? null,
      isActive: this.currentIsActive,
      academicYearId: this.authStore.academicyearid() || null,
    };

    this.isSaveClicked.set(true);
    this.timetableStore.create({
      endpoint: API.ADMIN.CONFIGURATION.TIMETABLE.ADDUPDATE,
      body: payload,
    });
  };

  onCancel = (): void => {
    this.dialogRef.close(false);
  };



  private loadDropdownOptions = (classId: string | null): void => {
    this.dropdownStore.getDropdown({
      key: TimetableDialog.DROPDOWN_KEYS.weekDay,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.WeekDays },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: Number(item.value),
        mnemonic: item.mnemonic
      }))
    });

    this.dropdownStore.getDropdown<DropdownOption>({
      key: TimetableDialog.DROPDOWN_KEYS.teacher,
      endpoint: API.ADMIN.USER.TEACHER.DROPDOWN
    });

    this.dropdownStore.getDropdown<DropdownOption>({
      key: TimetableDialog.DROPDOWN_KEYS.classroom,
      endpoint: API.ADMIN.CONFIGURATION.CLASSROOM.DROPDOWN,
    });

    this.loadSubjectsByClass(classId);

    this.dropdownStore.postDropdown<DropdownTimeslot>({
      key: TimetableDialog.DROPDOWN_KEYS.timeSlot,
      endpoint: API.ADMIN.CONFIGURATION.TIMESLOT.LIST,
      mapData: (items: DropdownTimeslot[]) => {
        const breakLookup: Record<string, boolean> = {};
        items.forEach((item) => {
          breakLookup[item.timeSlotId] = !!item.isBreak;
        });
        this.timeSlotBreakMap.set(breakLookup);

        return items.map((item) => ({
          text: item.slotName || item.name || `Time Slot #${item.timeSlotId}`,
          value: item.timeSlotId,
        }));
      },
    });
  };

  private resolveEditMode = (): void => {
    const timeTableId = this.dialogData?.timeTableId;
    if (CommonHelper.isEmptyGuid(timeTableId)) return;

    this.timetableStore.getById({
      endpoint: API.ADMIN.CONFIGURATION.TIMETABLE.GET,
      params: { timeTableId },
    });
  };

  private patchForm = (row: TimetableRecord): void => {
    this.formGroup.patchValue(row);
    this.currentIsActive = row.isActive ?? true;
  };

  private onClassSectionChange = (classSectionId: string | null): void => {
    if (this.isEditMode() && !this.isEditValuesSynced()) {
      return;
    }
    this.formGroup.controls.subjectId.setValue(null);
    this.loadSubjectsByClass(classSectionId);
  };

  private loadSubjectsByClass = (classId: string | null): void => {
    if (this.lastLoadedClassId === classId) return;
    this.lastLoadedClassId = classId;

    if (CommonHelper.isEmpty(classId)) {
      this.dropdownStore.resetKey(TimetableDialog.DROPDOWN_KEYS.subject);
      TimetableDialog.lastLoadedStoreClassId = null;
      return;
    }

    if (
      TimetableDialog.lastLoadedStoreClassId === classId &&
      this.subjectDropdownList().length > 0
    ) {
      return;
    }

    this.dropdownStore.getDropdown<DropdownOption>({
      key: TimetableDialog.DROPDOWN_KEYS.subject,
      endpoint: API.CLASS.SUBJECT_DROPDOWN,
      params: { classSectionId: classId },
      force: true,
    });
    TimetableDialog.lastLoadedStoreClassId = classId;
  };

  private patchTeacher = (options: ITextValueOption[]): void => {
    const control = this.formGroup.controls.teacherId;
    if (control.value || options.length <= 0) return;
    if (this.source() !== 'teacher') return;

    const preselectedId = this.dialogData?.selectedTeacherId;
    if (!preselectedId) return;

    const matchedOption = options.find((o) => String(o.value) === String(preselectedId));
    if (!matchedOption) return;
    control.patchValue(String(matchedOption.value));
  };

  private patchClassroom = (options: ITextValueOption[]): void => {
    const control = this.formGroup.controls.classSectionId;
    if (control.value || options.length <= 0) return;
    if (this.source() !== 'classroom') return;

    const preselectedId = this.dialogData?.selectedClassSectionId;
    if (CommonHelper.isEmpty(preselectedId)) return;

    const matchedOption = options.find((o) => String(o.value) === String(preselectedId));
    if (!matchedOption) return;
    control.patchValue(String(matchedOption.value));
  };

  private patchPreselectedSlotContext = (): void => {
    if (this.isEditMode()) return;
    const selectedTimeSlotId = this.dialogData?.selectedTimeSlotId;
    const selectedWeekDayId = this.dialogData?.selectedWeekDayId;

    if (!CommonHelper.isEmpty(selectedTimeSlotId)) {
      this.formGroup.controls.timeSlotId.patchValue(selectedTimeSlotId!);
    }

    if (!CommonHelper.isEmpty(selectedWeekDayId)) {
      this.formGroup.controls.weekDayId.patchValue(selectedWeekDayId!);
    }
  };

  private hasOption = (list: ITextValueOption[], value?: string | null): boolean => {
    if (CommonHelper.isEmpty(value)) return false;
    return list.some((item) => String(item.value) === String(value));
  };

  ngOnDestroy(): void {
    this.timetableStore.resetState();
  }
}
