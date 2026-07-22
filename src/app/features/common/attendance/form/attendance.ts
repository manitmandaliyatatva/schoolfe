import { Component, TemplateRef, ViewChild, effect, inject, signal, OnInit, OnDestroy, computed, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { CommonDataGridComponent } from '../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGrid, SelectionState } from '../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { CommonDataGridFieldDataType } from '../../../../shared/components/common-data-grid/enums/grid.enum';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../shared/models/form-control-base.model';
import { CommonButtonConfig } from '../../../../shared/components/button/model/button.model';
import { getDatePickerConfig, getDropdownConfig } from '../../../../shared/functions/config-function';
import { SYSTEM_CONST } from '../../../../core/constants/system.constant';
import { ToastrHelperService } from '../../../../core/services/toster-helper.service';
import { attendenceStatusStore, IAttendenceStatus } from '../../../admin/configuration/attendence-status/models/attendence-status';
import { filter, debounceTime, startWith } from 'rxjs';
import { CommonHelperService } from '../../../../core/services/common-helper.service';
import { CommonDropdownStore } from '../../../../core/store/common-dropdown.store';
import { API } from '../../../../shared/constants/api-url';
import { TITLES } from '../../../../shared/constants/title.constant';
import { ExportService } from '../../../../core/services/export.service';
import { buildGridListRequest, buildGridToolbarButton } from '../../../../shared/helpers/grid.helper';
import { ITextValueOption } from '../../../../shared/models/common.model';
import { StudentAttendance, takeAttendenceStore, saveAttendenceStore, IStudentAttendanceForm } from '../../../teacher/attendance/attendance.model';
import { MatTableModule } from '@angular/material/table';
import { ATTENDANCE_CONST } from '../attendance.model';
import CommonHelper from '../../../../core/helpers/common-helper';
import { SafeImageComponent } from '../../../../shared/components/safe-image/safe-image.component';
import { HolidayHelperService } from '../../../../core/services/holiday-helper.service';
import { AuthStore } from '../../../../core/store/auth.store';
import { AcademicYearHelperService } from '../../../../core/services/academic-year-helper.service';
import { GlobalRefreshService } from '../../../../core/services/global-refresh.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'take-student-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatCardModule,
    CommonDataGridComponent,
    MatRadioModule,
    SafeImageComponent,
    DynamicFormComponent
  ],
  templateUrl: './attendance.html',
  styleUrls: ['./attendance.scss']
})
export class AttendanceComponent implements OnInit, OnDestroy {
  @ViewChild('adStatus', { static: true }) adStatus!: TemplateRef<any>;
  @ViewChild('adRemark', { static: true }) adRemark!: TemplateRef<any>;
  @ViewChild('adSave', { static: true }) adSave!: TemplateRef<any>;
  @ViewChild('studentNameCell', { static: true }) studentNameCell!: TemplateRef<any>;

  readonly bgColor = "#e3dcdc"
  readonly color = "#999999"
  readonly systemConst = SYSTEM_CONST;

  studentListGrid!: CommonDataGrid<StudentAttendance>;
  isDisablePrevious = signal<boolean>(false);

  private readonly fb = inject(FormBuilder);
  private readonly tostr = inject(ToastrHelperService);
  private classroomOptions: ITextValueOption[] = [];
  private navigationState: { classSectionId: string } | null = null;

  protected checkBoxSelectionState = signal<SelectionState>('notSelected');

  readonly store = inject(takeAttendenceStore);
  readonly saveAttandence = inject(saveAttendenceStore);
  readonly attendanceStatusStore = inject(attendenceStatusStore);
  readonly dropdownStore = inject(CommonDropdownStore)
  readonly commonHelperService = inject(CommonHelperService);
  readonly permission = computed(() => this.commonHelperService.getPermissionByPage());
  readonly canSave = computed(() => this.permission().canMark);
  readonly isReadOnly = computed(() => this.isDisablePrevious() || !this.canSave());
  readonly classroomDropdownList = this.dropdownStore.getList('classSection');
  readonly holidayHelperService = inject(HolidayHelperService);
  readonly authStore = inject(AuthStore);
  readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly globalRefreshService = inject(GlobalRefreshService);
  private readonly exportService = inject(ExportService);

  importBtnConfig = this.exportService.getImportButtonConfig(() => {
    const classSectionId = this.formGroup.get('classSection')?.value;
    const attendanceDate = this.formGroup.get('date')?.value;
    if (!classSectionId || !attendanceDate) return null;
    return {
      title: ATTENDANCE_CONST.IMPORT_STUDENT_ATTENDANCE,
      sampleFileEndpoint: API.SAMPLE_FILE.STUDENT_ATTENDANCE,
      endpoint: API.IMPORT_FILE.STUDENT_ATTENDANCE,
      queryParams: {
        classSectionId: classSectionId,
        attendanceDate: CommonHelper.toDateOnly(attendanceDate)
      }
    };
  }, () => {
    const classSectionId = this.formGroup.get('classSection')?.value;
    const attendanceDate = this.formGroup.get('date')?.value;
    if (classSectionId && attendanceDate) {
      this.loadAttendance(classSectionId, attendanceDate);
    }
  });


  readonly saveBtn = signal<CommonButtonConfig>(buildGridToolbarButton({
    tooltipText: SYSTEM_CONST.ACTION_BUTTONS.SAVE,
    icon: 'save',
    callback: () => this.saveAttendance(),
    disableCallBack: () => this.isReadOnly(),
    isPrimary: true
  }));

  readonly refreshBtnConfig = computed<CommonButtonConfig>(() => (CommonHelper.getRefreshButtonConfig(() => {
    const classSectionId = this.formGroup.get('classSection')?.value;
    const dateValue = this.formGroup.get('date')?.value;
    if (classSectionId && dateValue) {
      this.loadAttendance(classSectionId, dateValue);
    }
  }, true)));

  students = signal<StudentAttendance[]>([]);
  selectedStudents = signal<StudentAttendance[]>([]);
  initialStudents = signal<StudentAttendance[]>([]);

  classSectionDropdown = signal(getDropdownConfig(
    'classSection',
    SYSTEM_CONST.LABELS.COMMON.CLASSROOM,
    this.classroomOptions,
    null,
    null,
    (data: ITextValueOption) => {
      if (data && data.value) {
        this.onClassroomChange(String(data.value));
      }
    }
  ));
  dateConfig = signal(getDatePickerConfig(
    'date',
    SYSTEM_CONST.LABELS.COMMON.DATE,
    'outline',
    null,
    () => this.academicYearHelper.getAcademicYearStartDate(),
    () => this.academicYearHelper.getAttendanceMaxDate()
  ));
  screenTitle = signal(`${TITLES.TEACHER.DASHBOARD}`);
  formGroup = this.fb.nonNullable.group({
    classSection: this.fb.control(null),
    date: this.fb.control(this.academicYearHelper.getValidAttendanceDate(new Date()))
  });

  filterFormControls = computed<DynamicForm>(() => ({
    formSection: [
      {
        controls: [
          {
            control: this.classSectionDropdown(),
            type: DynamicFormControlType.DropDown,
            class: 'col-md-4'
          },
          {
            control: this.dateConfig(),
            type: DynamicFormControlType.Datepicker,
            class: 'col-md-4'
          },
        ],
      },
    ],
  }));

  constructor() {
    this.bindDropdownToControl('classSectionId', this.classroomDropdownList, (options) => {
      this.classroomOptions = options;

      let targetClassroom: any = null;
      if (this.navigationState?.classSectionId && options.length > 0) {
        const exists = options.some(o => o.value?.toString() === this.navigationState?.classSectionId?.toString());
        if (exists) {
          targetClassroom = this.navigationState.classSectionId;
        }
      } else if (options.length > 0 && !this.formGroup.get('classSection')?.value) {
        targetClassroom = options[0].value;
      }

      if (targetClassroom) {
        this.formGroup.controls.classSection.setValue(targetClassroom);
        this.onClassroomChange(targetClassroom);
      }
    });

    this.formGroup.controls.date.valueChanges.pipe(
      untilDestroyed(this),
      debounceTime(300),
    ).subscribe((date) => {
      if (date && this.formGroup.controls.date.valid) {
        this.checkDisablingLogic(date);
        this.onFilterChange();
      }
    });
    effect(() => {
      if (this.store.isSuccess()) {
        this.students.set(this.store.list());
        this.initialStudents.set(structuredClone(this.store.list()));
        this.studentListGrid = this.buildGridConfig(this.store.list());
      }
    });
  }
  ngOnDestroy(): void {
    this.store.resetState();
    this.attendanceStatusStore.resetState();
    this.dropdownStore.resetState();
    this.isDisablePrevious.set(false)
  }

  ngOnInit(): void {
    this.navigationState = history.state;

    this.loadData();

    this.globalRefreshService.globalRefreshObservable.pipe(
      untilDestroyed(this)
    ).subscribe(() => {
      this.loadData();
      this.formGroup.controls.date.markAsPristine();
      const classroom = this.formGroup.controls.classSection.value;
      if (classroom) {
        this.onClassroomChange(classroom);
      }
      setTimeout(() => {
        this.formGroup.controls.date.setValue(this.academicYearHelper.getValidAttendanceDate());
        this.formGroup.updateValueAndValidity();
      });
    });
  }

  bindDropdownToControl = (
    formControlName: string,
    source: () => ITextValueOption[],
    assign: (options: ITextValueOption[]) => void,
    afterAssign?: () => void
  ): void => {
    effect(() => {
      const options = source();
      assign(options);
      this.updateDropdownData(formControlName, options);
      afterAssign?.();
    });
  };

  updateDropdownData = (formControlName: string, options: ITextValueOption[]): void => {
    this.classSectionDropdown.update(data => ({ ...data, data: options }));
  };

  loadData = (): void => {
    this.attendanceStatusStore.getAll({
      endpoint: API.ADMIN.CONFIGURATION.ATTENDENCE_STATUS.LIST,
      body: buildGridListRequest<IAttendenceStatus>(null)
    });

    const isTeacher = true;
    this.dropdownStore.getDropdown<any>({
      key: 'classSection',
      force: true,
      endpoint: API.ADMIN.CONFIGURATION.CLASSROOM.DROPDOWN,
      params: { timetableSection: isTeacher },
      mapData: (items: any[]) =>
        items.map((item) => ({
          text: item.text,
          value: item.value,
        })),
    });
  }

  buildGridConfig = (dataList: any): CommonDataGrid<StudentAttendance> => {
    return {
      id: `student-grid`,
      primaryKey: 'attendanceId' as string,
      checkboxConfig: {
        showCheckboxSelection: !this.isReadOnly(),
        showMasterCheckBox: !this.isReadOnly(),
        getSelectedRows: (included, excluded, state, count) => {
          this.checkBoxSelectionState.update(() => state);

          switch (state) {
            case 'checked':
              this.selectedStudents.set(this.students());
              break;
            case 'notSelected':
              this.selectedStudents.set([]);
              break;

            case 'intermediate':
              if (excluded.length > 0) {
                const excludedIds = new Set(excluded.map(e => e.studentId));
                this.selectedStudents.set(
                  this.students().filter(s => !excludedIds.has(s.studentId))
                );
              } else if (included.length > 0) {
                this.selectedStudents.set(included);
              } else {
                this.selectedStudents.set([]);
              }
              break;

            default:
              this.selectedStudents.set([]);
          }
        },
      },
      columns: [
        {
          field: 'fullName',
          title: ATTENDANCE_CONST.STUDENT_NAME,
          customRenderCell: this.studentNameCell,
          fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate
        },
        {
          field: 'attendanceStatusId',
          title: ATTENDANCE_CONST.STATUS,
          customRenderCell: this.adStatus,
          fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate
        },
        {
          field: 'remark',
          title: ATTENDANCE_CONST.REMARK,
          customRenderCell: this.adRemark,
          fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate
        },
        {
          field: 'studentId',
          title: SYSTEM_CONST.LABELS.COMMON.ACTION,
          customRenderCell: this.adSave,
          fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
          isHidden: this.isReadOnly()
        }
      ],
      data: dataList,
      features: {
        toolbar: {
          buttonConfig: [
            this.refreshBtnConfig(),
            ...(!this.isReadOnly() && this.permission().canImport ? [this.importBtnConfig] : []),
            ...(!this.isReadOnly() && this.canSave() ? [this.saveBtn()] : [])
          ]
        }
      }
    };
  };

  updateStatus = (id: string, attendanceStatusId: StudentAttendance['attendanceStatusId']) => {
    this.students.update(list =>
      list.map(s => s.studentId === id ? { ...s, attendanceStatusId } : s)
    );
    this.studentListGrid = {
      ...this.studentListGrid,
      data: this.students()
    };
  }

  updateRemark = (id: string, remark: string) => {
    if (!CommonHelper.isEmpty(id)) {
      this.students.update(list =>
        list.map(s => s.studentId === id ? { ...s, remark } : s)
      );
    } else {
      this.selectedStudents.update(list =>
        list.map(s => ({
          ...s,
          remark
        }))
      );
      const updatedStudents = this.students().map(student => {
        const updated = this.selectedStudents().find(s => s.studentId === student.studentId);
        return updated ? updated : student;
      });

      this.students.set(updatedStudents);
      this.studentListGrid = {
        ...this.studentListGrid,
        data: this.students()
      };
    }
  }

  getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  onChange = (event: MatRadioChange): void => {
    this.students.update(list =>
      list.map(s => ({
        ...s,
        attendanceStatusId: event.value
      }))
    );

    this.studentListGrid = {
      ...this.studentListGrid,
      data: this.students()
    };
  }

  onChangeSelected = (event: MatRadioChange): void => {
    this.selectedStudents.update(list =>
      list.map(s => ({
        ...s,
        attendanceStatusId: event.value
      }))
    );

    // Replace matching students by id, keep rest as-is
    const updatedStudents = this.students().map(student => {
      const updated = this.selectedStudents().find(s => s.studentId === student.studentId);
      return updated ? updated : student;
    });

    this.students.set(updatedStudents);

    this.studentListGrid = {
      ...this.studentListGrid,
      data: this.students()
    };
  }

  saveAttendance = (studentId?: string) => {
    const attendanceDate = CommonHelper.toDateOnly(this.formGroup.get('date').value);

    let studentsToSave = this.students();

    if (!CommonHelper.isEmpty(studentId)) {
      // ── Individual Row Save ──────────────────────────────────────
      const student = this.students().find(s => s.studentId === studentId);
      if (!student) return;

      // Validation: status must be selected
      if (CommonHelper.isEmpty(student.attendanceStatusId)) {
        this.tostr.showErrorMessage(ATTENDANCE_CONST.SELECT_STATUS);
        return;
      }

      // Skip if nothing changed from initial snapshot
      const initial = this.initialStudents().find(s => s.studentId === studentId);
      const hasChanged = !initial
        || initial.attendanceStatusId !== student.attendanceStatusId
        || initial.remark !== student.remark;

      if (!hasChanged) {
        this.tostr.showWarningMessage(ATTENDANCE_CONST.NO_CHANGES); // or silently return
        return;
      }

      studentsToSave = [student];

    } else {
      // ── Bulk Save ────────────────────────────────────────────────
      const selectedStudents = this.students().filter(s => !CommonHelper.isEmpty(s.attendanceStatusId));

      // Validation 1: at least one row must be selected
      if (selectedStudents.length === 0) {
        this.tostr.showErrorMessage(ATTENDANCE_CONST.SELECT_STUDENT);
        return;
      }

      // Validation 2: all selected rows must have a status
      const missingStatus = selectedStudents.some(
        s => CommonHelper.isEmpty(s.attendanceStatusId)
      );
      if (missingStatus) {
        this.tostr.showErrorMessage(ATTENDANCE_CONST.SELECT_STATUS);
        return;
      }

      // Only include rows where data actually changed from initial snapshot
      studentsToSave = selectedStudents.filter(student => {
        const initial = this.initialStudents().find(s => s.studentId === student.studentId);
        return !initial
          || initial.attendanceStatusId !== student.attendanceStatusId
          || initial.remark !== student.remark;
      });

      // Skip API call if nothing has changed at all
      if (studentsToSave.length === 0) {
        this.tostr.showWarningMessage(ATTENDANCE_CONST.NO_CHANGES);
        return;
      }
    }

    // ── API Call ───────────────────────────────────────────────────
    this.saveAttandence.create({
      endpoint: API.STUDENT.ATTENDANCE.ADDUPDATE,
      body: {
        classSectionId: this.formGroup.get('classSection').value,
        attendanceDate,
        students: studentsToSave
      } satisfies IStudentAttendanceForm
    });
  };

  loadAttendance = (classSection: string, date: Date) => {
    this.store.getAll({
      endpoint: API.STUDENT.ATTENDANCE.GET_BY_CLASS_SECTION,
      params: {
        classSectionId: classSection,
        attendanceDate: new Date(date).toDateString()
      }
    })
  };

  getCurrentCount = (id: string) => {
    return this.students()?.filter(item => item.attendanceStatusId === id)?.length;
  }

  onClassroomChange = (classroom: string): void => {
    this.holidayHelperService.loadHolidays({
      classSectionId: classroom,
      startDate: CommonHelper.toDateOnly(this.academicYearHelper.getAcademicYearStartDate())
    })
    .pipe(untilDestroyed(this))
    .subscribe((holidays) => {
      const disabledDates = (holidays && Array.isArray(holidays))
        ? holidays.map(h => new Date(h.date as any))
        : [];
      this.dateConfig.update(cfg => ({
        ...cfg,
        disabledDates
      }));
      this.formGroup.controls.date.updateValueAndValidity({ emitEvent: false });

      if (!this.formGroup.controls.date.dirty) {
        const nextDate = this.academicYearHelper.getValidAttendanceDate(this.holidayHelperService.getLastWorkingDay());
        this.formGroup.controls.date.setValue(nextDate, { emitEvent: false });
        
        this.checkDisablingLogic(nextDate);
        this.onFilterChange();
      } else {
        this.checkDisablingLogic(this.formGroup.controls.date.value);
        this.onFilterChange();
      }
    });
  };

  onFilterChange = (): void => {
    const classSection = this.formGroup.controls.classSection.value;
    const date = this.formGroup.controls.date.value;
    if (classSection && date && this.formGroup.valid) {
      this.loadAttendance(classSection, date);
    }
  };

  checkDisablingLogic = (date: any): void => {
    if (!date) return;
    
    const shouldDisable = this.academicYearHelper.isAttendanceDisabled(date);

    this.isDisablePrevious.set(shouldDisable);

    if (this.studentListGrid) {
      this.studentListGrid = {
        ...this.studentListGrid,
        checkboxConfig: {
          ...this.studentListGrid.checkboxConfig,
          showCheckboxSelection: !shouldDisable && this.canSave(),
          showMasterCheckBox: !shouldDisable && this.canSave()
        }
      };
    }
  };
}