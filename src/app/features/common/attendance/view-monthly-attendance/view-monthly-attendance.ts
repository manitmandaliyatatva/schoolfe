import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, OnDestroy, OnInit, signal, TemplateRef, ViewChild, computed, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { filter, debounceTime, startWith } from 'rxjs';
import { CommonDropdownStore } from '../../../../core/store/common-dropdown.store';
import { CommonDataGridFieldDataType } from '../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGrid } from '../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API as API_URL } from '../../../../shared/constants/api-url';
import { getDropdownConfig } from '../../../../shared/functions/config-function';
import { buildGridListRequest } from '../../../../shared/helpers/grid.helper';
import { CommonButtonConfig } from '../../../../shared/components/button/model/button.model';
import { ExportConst, ExportService } from '../../../../core/services/export.service';
import { ITextValueOption } from '../../../../shared/models/common.model';
import { attendenceStatusStore, IAttendenceStatus } from '../../../admin/configuration/attendence-status/models/attendence-status';
import { monthlyAttendanceStore } from '../../../teacher/attendance/attendance.model';
import { CommonDataGridComponent } from '../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonModule } from '@angular/common';
import { MaterialModule } from "../../../../core/modules/material/material.module";
import { ATTENDANCE_CONST, IStudentAttendanceReport, ITeacherAttendanceReport, reportAttandenceStore } from '../attendance.model';
import { SYSTEM_CONST } from '../../../../core/constants/system.constant';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../shared/models/form-control-base.model';
import { HolidayHelperService } from '../../../../core/services/holiday-helper.service';
import { MultiColorProgressbarComponent } from '../../../../shared/components/multi-color-progressbar/multi-color-progressbar.component';
import { ProgressSegment } from '../../../../shared/components/multi-color-progressbar/model/multi-color-progressbar.model';
import CommonHelper from '../../../../core/helpers/common-helper';
import { AcademicYearHelperService } from '../../../../core/services/academic-year-helper.service';
import { GlobalRefreshService } from '../../../../core/services/global-refresh.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CommonHelperService } from '../../../../core/services/common-helper.service';

@UntilDestroy()
@Component({
  selector: 'app-view-monthly-attendance',
  imports: [ReactiveFormsModule, CommonDataGridComponent, CommonModule, MaterialModule, DynamicFormComponent, MultiColorProgressbarComponent],
  templateUrl: './view-monthly-attendance.html',
  styleUrl: './view-monthly-attendance.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewMonthlyAttendance implements OnInit, OnDestroy {
  @ViewChild('attendanceCellTemplate', { static: true }) attendanceCellTemplate!: TemplateRef<any>;
  @ViewChild('nameTemplate', { static: true }) nameTemplate!: TemplateRef<any>;
  @ViewChild('atBadge', { static: true }) atBadge!: TemplateRef<any>;
  @ViewChild('attendanceTemplate', { static: true }) attendanceTemplate!: TemplateRef<any>;

  readonly mode = input<'teacher' | 'student' | 'admin'>();
  readonly pageType = input<'view' | 'report'>();
  readonly cdrf = inject(ChangeDetectorRef);
  private readonly exportService = inject(ExportService);
  private readonly commonHelperService = inject(CommonHelperService);
  readonly permission = computed(() => this.commonHelperService.getPermissionByPage());

  private readonly fb = inject(FormBuilder);
  private classroomOptions: ITextValueOption[] = [];
  readonly listStore = inject(monthlyAttendanceStore);
  readonly reportStore = inject(reportAttandenceStore);
  readonly dropdownStore = inject(CommonDropdownStore)
  readonly attendanceStatusStore = inject(attendenceStatusStore);
  readonly holidayHelperService = inject(HolidayHelperService);
  private readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly globalRefreshService = inject(GlobalRefreshService);
  readonly classroomDropdownList = this.dropdownStore.getList('classSection');

  classSectionDropdown = signal(getDropdownConfig('classSection', SYSTEM_CONST.LABELS.COMMON.CLASSROOM, this.classroomOptions));
  monthYearDropdown = computed(() => getDropdownConfig('monthYear', 'Select Month & Year', this.academicYearHelper.generateMonthYearOptions()));
  detailsViewGrid!: CommonDataGrid<any>;
  reportViewGrid!: CommonDataGrid<any>;

  exportBtnConfig = computed<CommonButtonConfig>(() =>
    this.exportService.getExportButtonConfig(
      () => this.exportAttendance(),
      () => this.formGroup.invalid || this.exportService.isExporting()
    )
  );

  refreshBtnConfig = computed<CommonButtonConfig>(() =>
    CommonHelper.getRefreshButtonConfig(() => {
      const { classSection, monthYear } = this.formGroup.value;
      if (monthYear) {
        const [yearStr, monthStr] = monthYear.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        if (this.pageType() === 'view')
          this.loadAttendanceDetails(classSection ?? null, month, year);
        else if (this.pageType() === 'report')
          this.loadAttendanceReport(classSection ?? null, month, year);
      }
    }, true)
  );

  formGroup = this.fb.nonNullable.group({
    classSection: this.fb.control<string | null>(null),
    monthYear: this.fb.control<string>('')
  });

  filterFormControls = computed<DynamicForm>(() => {
    const isClassVisible = ((this.mode() == 'teacher') && this.pageType() == 'view') || (this.mode() == 'student' && this.pageType() == 'report');
    return {
      formSection: [
        {
          controls: [
            {
              control: this.classSectionDropdown(),
              type: DynamicFormControlType.DropDown,
              class: 'col-md-4',
              isHiddenField: () => !isClassVisible
            },
            {
              control: this.monthYearDropdown(),
              type: DynamicFormControlType.DropDown,
              class: 'col-md-4'
            }
          ],
        },
      ],
    };
  });

  constructor() {
    this.bindDropdownToControl('classSection', this.classroomDropdownList, (options) => {
      this.classroomOptions = options;
      const isVisible = ((this.mode() == 'teacher') && this.pageType() == 'view') || (this.mode() == 'student' && this.pageType() == 'report');
      if (isVisible && options.length > 0 && !this.formGroup.get('classSection')?.value) {
        this.formGroup.get('classSection')?.setValue(options[0].value as string);
      }
    });
    this.formGroup.valueChanges.pipe(
      untilDestroyed(this),
      startWith(this.formGroup.value),
      filter(() => this.formGroup.valid),
      filter(item => !!item.monthYear),
      debounceTime(300),
    ).subscribe(({ classSection, monthYear }) => {
      if (!monthYear) return;
      const [yearStr, monthStr] = monthYear.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      const startDate = CommonHelper.toDateOnly(new Date(year, month - 1, 1));
      const endDate = CommonHelper.toDateOnly(new Date(year, month, 0));

      const payload: any = { startDate, endDate };
      if (this.mode() === 'admin') {
        payload.isForTeacher = true;
      } else if (classSection) {
        payload.classSectionId = String(classSection);
      }

      this.holidayHelperService.loadHolidays(payload).pipe(untilDestroyed(this)).subscribe();

      if (this.pageType() == 'view')
        this.loadAttendanceDetails(classSection ?? null, month, year)
      else if (this.pageType() == 'report')
        this.loadAttendanceReport(classSection ?? null, month, year)
    });

    effect(() => {
      this.holidayHelperService.list();
      if (this.listStore.isSuccess()) {
        untracked(() => {
          this.detailsViewGrid = this.buildGridConfigForDetails(this.listStore.list());
          this.cdrf.markForCheck();
        });
      }
    });

    effect(() => {
      if (this.reportStore.isSuccess()) {
        this.reportViewGrid = this.buildGridConfigForReport(this.reportStore.list() as any);
        this.cdrf.markForCheck();
      }
    });
  }
  ngOnDestroy(): void {
    this.holidayHelperService.clearHolidays();
    this.listStore.resetState();
    this.dropdownStore.resetKey('classSection');
    this.attendanceStatusStore.resetState();
    this.reportStore.resetState();
  }

  ngOnInit(): void {
    const options = this.academicYearHelper.generateMonthYearOptions();
    const currentDateStr = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
    const defaultOption = options.find(o => o.value === currentDateStr) ? currentDateStr : (options[0]?.value as string);
    this.formGroup.controls.monthYear.setValue(defaultOption);

    this.loadData();

    this.globalRefreshService.globalRefreshObservable.pipe(
      untilDestroyed(this)
    ).subscribe(() => {
      this.loadData();
      let { monthYear } = this.formGroup.value;

      const options = this.academicYearHelper.generateMonthYearOptions();
      const exists = options.some(o => o.value === monthYear);
      let targetValue = monthYear;
      if (!exists && options.length > 0) {
        const currentDateStr = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
        targetValue = options.find(o => o.value === currentDateStr) ? currentDateStr : (options[0]?.value as string);
      }

      this.formGroup.controls.monthYear.setValue(targetValue as string);
      this.formGroup.updateValueAndValidity();
    });

    if (this.pageType() == 'view')
      this.detailsViewGrid = this.buildGridConfigForDetails(null);
    else if (this.pageType() == 'report')
      this.reportViewGrid = this.buildGridConfigForReport(null);
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
      endpoint: API_URL.ADMIN.CONFIGURATION.ATTENDENCE_STATUS.LIST,
      body: buildGridListRequest<IAttendenceStatus>(null)
    });

    this.dropdownStore.getDropdown<any>({
      key: 'classSection',
      force: true,
      endpoint: API_URL.ADMIN.CONFIGURATION.CLASSROOM.DROPDOWN,
      params: { timetableSection: true },
      mapData: (items: any[]) =>
        items.map((item) => ({
          text: item.text,
          value: item.value,
        })),
    });
  }

  buildGridConfigForDetails = (apiResponse: any): CommonDataGrid<any> => {
    const isStudent = this.mode() != 'admin';
    const list = isStudent && apiResponse
      ? apiResponse?.studentAttendances
      : apiResponse?.teacherAttendances;

    const transformed = this.transformAttendanceGeneric(list);

    const dates = this.getMonthDatesWithDayLetter();

    if (transformed) {
      const monthYear = this.formGroup.get('monthYear')?.value || '';
      const parsedDate = CommonHelper.parseDateString(monthYear, 'YYYY-MM');
      const year = parsedDate ? parsedDate.getFullYear() : new Date().getFullYear();
      const month = parsedDate ? parsedDate.getMonth() : new Date().getMonth();

      transformed.forEach(row => {
        dates.forEach(d => {
          const key = `day_${d.day}`;
          const dateObj = new Date(year, month, d.day);
          const dateStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
          const weekdayStr = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

          if (!row[key]) {
            if (d.isHoliday) {
              row[key] = { status: 'H', color: '#6b21a8', background: '#e8d8ff', remark: 'Holiday', isHoliday: true, dateStr, weekdayStr };
            } else if (d.isWeekOff) {
              row[key] = { status: '', color: '#696969ff', background: '#f5f5f5', remark: 'Week Off', isWeekOff: true, dateStr, weekdayStr };
            } else {
              row[key] = { status: '', color: 'inherit', background: 'transparent', remark: '', dateStr, weekdayStr };
            }
          } else {
            row[key].dateStr = dateStr;
            row[key].weekdayStr = weekdayStr;
          }
        });
      });
    }

    const dateColumns = dates.map(d => ({
      field: `day_${d.day}`,
      title: `${d.day}\n${d.letter}`,
      customRenderCell: this.attendanceCellTemplate,
      fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
      cellStyle: (row: any) => {
        const value = row[`day_${d.day}`];
        return {
          'background-color': value?.background || 'transparent',
          'color': value?.color || 'inherit',
          'text-align': 'center',
          'min-width': '38px',
          'max-width': '38px',
          'width': '38px',
          'overflow': 'hidden',
          'padding': '0',
          'white-space': 'nowrap',
          'font-size': '12.5px',
        };
      }
    }));

    return {
      id: 'attendance-grid',
      primaryKey: 'id',
      features: {
        toolbar: {
          buttonConfig: (this.mode() === 'admin' || this.mode() === 'teacher')
            ? [
              this.refreshBtnConfig(),
              ...(this.permission().canExport ? [this.exportBtnConfig()] : [])
            ]
            : [this.refreshBtnConfig()]
        }
      },
      columns: [
        {
          field: 'name',
          title: isStudent ? ATTENDANCE_CONST.STUDENT_NAME : ATTENDANCE_CONST.TEACHER_NAME,
          customRenderCell: this.nameTemplate,
          fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate
        },
        ...dateColumns
      ],
      data: transformed
    };
  };

  transformAttendanceGeneric = (data: any[]) => {
    return data && data.map(entity => {

      const row: any = {
        id: entity.studentId || entity.teacherId,
        name: entity.studentName || entity.teacherName,
        rollNumber: entity.rollNumber || entity.teacherCode || '',
        presentCount: 0,
        absentCount: 0,
        halfDayCount: 0,
        leaveCount: 0
      };

      entity.dailyAttendances?.forEach((d: any) => {

        const key = `day_${d.day}`;

        row[key] = d.statusCode
          ? {
            status: d.statusCode,
            color: d.colorCode,
            background: d.backgroundColorCode,
            remark: d.remark
          }
          : null;

        // Count logic
        switch (d.statusCode) {
          case 'P': row.presentCount++; break;
          case 'A': row.absentCount++; break;
          case 'HD': row.halfDayCount++; break;
          case 'L': row.leaveCount++; break;
        }
      });

      return row;
    });
  };

  buildGridConfigForReport = (apiResponse: any) => {
    const config: CommonDataGrid<any> = {
      id: 'report-grid',
      primaryKey: 'id',
      features: {
        toolbar: {
          buttonConfig: [this.refreshBtnConfig()]
        }
      },
      columns: [
        {
          field: this.mode() == 'student' ? 'studentId' : 'teacherId',
          title: '',
          isHidden: true
        },
        {
          field: this.mode() == 'student' ? 'studentName' : 'teacherName',
          title: this.mode() == 'student' ? ATTENDANCE_CONST.STUDENT_NAME : ATTENDANCE_CONST.TEACHER_NAME,
        },
        {
          field: 'percentage',
          title: ATTENDANCE_CONST.PERCENTAGE,
          customRenderCell: this.attendanceTemplate,
          fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
          alignment: 'center'
        },
        {
          field: 'presentDays',
          title: ATTENDANCE_CONST.PRESENT,
          alignment: 'center'
        },
        {
          field: 'halfDays',
          title: ATTENDANCE_CONST.HALF_DAYS,
          alignment: 'center'
        },
        {
          field: 'absentDays',
          title: ATTENDANCE_CONST.ABSENT,
          alignment: 'center'
        },
        {
          field: 'pendingDays',
          title: ATTENDANCE_CONST.PENDING,
          alignment: 'center'
        },
        {
          field: 'totalDays',
          title: ATTENDANCE_CONST.TOTAL_DAYS,
          alignment: 'center'
        }
      ],
      data: apiResponse
    };
    return config;
  }

  getProgressSegments = (row: IStudentAttendanceReport | ITeacherAttendanceReport): ProgressSegment[] => {
    return [
      { value: row.presentDays || 0, color: '#2e7d32', label: 'Present' },
      { value: row.halfDays || 0, color: '#f57c00', label: 'Half Day' },
      { value: row.absentDays || 0, color: '#c62828', label: 'Absent' },
      { value: row.pendingDays || 0, color: '#bdbdbd', label: 'Pending' }
    ];
  };

  getMonthDatesWithDayLetter = (): { day: number; letter: string; isWeekOff: boolean; isHoliday: boolean }[] => {
    const monthYear = this.formGroup.get('monthYear')?.value || '';
    if (!monthYear) return [];
    const [yearStr, monthStr] = monthYear.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const weeklyOffs = this.holidayHelperService.weeklyOffs();

    return Array.from({ length: totalDays }, (_, i) => {
      const date = new Date(year, month, i + 1);
      const status = this.holidayHelperService.checkHolidayStatus(date);

      const dayOfWeek = date.getDay();
      const weekNum = Math.ceil(date.getDate() / 7);
      const isConfiguredWeekOff = weeklyOffs.some(item =>
        item.weekDay === dayOfWeek &&
        (item.weekNumber?.includes(0) || item.weekNumber?.includes(weekNum))
      );

      return {
        day: i + 1,
        letter: date.toLocaleDateString('en-US', { weekday: 'short' })[0],
        isWeekOff: status.isWeekOff || isConfiguredWeekOff,
        isHoliday: status.isHoliday
      };
    });
  };

  // getMonthDatesWithDayLetter = (): { day: number; letter: string }[] => {
  //   const year = this.formGroup.get('year').value;
  //   const month = (this.formGroup.get('month').value) - 1;

  //   const totalDays = new Date(year, month + 1, 0).getDate();

  //   return Array.from({ length: totalDays }, (_, i) => {
  //     const date = new Date(year, month, i + 1);

  //     return {
  //       day: i + 1,
  //       letter: date.toLocaleDateString('en-US', { weekday: 'short' })[0] // M, T, W
  //     };
  //   });
  // }
  loadAttendanceDetails = (classSection: string | null, month: number, year: number) => {
    const url = ['admin'].includes(this.mode()) ? API_URL.TEACHER.ATTENDANCE.DETAILS : API_URL.STUDENT.ATTENDANCE.DETAILS
    const payload: any = {
      month: month,
      year: year
    }
    if (this.mode() == 'teacher') {
      payload.classSectionId = classSection;
    }
    this.listStore.getAll({
      endpoint: url,
      params: payload
    })
  }
  loadAttendanceReport = (classSection: string | null, month: number, year: number) => {
    const isTeacherReport = ['teacher', 'admin'].includes(this.mode());
    const url = isTeacherReport ? API_URL.TEACHER.ATTENDANCE.MONTHLY_REPORT : API_URL.STUDENT.ATTENDANCE.MONTHLY_REPORT
    const payload: any = {
      month: month,
      year: year
    };
    if (this.mode() == 'student') {
      payload.classSectionId = classSection;
    }
    this.reportStore.getAll({
      endpoint: url,
      params: payload
    })
  }

  exportAttendance = (): void => {
    if (this.formGroup.invalid) return;

    const { classSection, monthYear } = this.formGroup.value;
    if (!monthYear) return;

    const [yearStr, monthStr] = monthYear.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const isTeacher = this.mode() === 'teacher';
    const endpoint = isTeacher ? API_URL.STUDENT.ATTENDANCE.EXPORT : API_URL.TEACHER.ATTENDANCE.EXPORT;

    const body: any = { month, year };
    if (isTeacher && classSection) {
      body.classSectionId = classSection;
    }

    const selectedOption = this.academicYearHelper.generateMonthYearOptions().find(o => o.value === monthYear);
    const monthName = selectedOption ? selectedOption.text.split(' ')[0] : '';
    const exportType = isTeacher ? SYSTEM_CONST.LABELS.USER.STUDENT : SYSTEM_CONST.LABELS.USER.TEACHER;

    this.exportService.export({
      endpoint,
      payload: body,
      defaultFileName: ExportConst.FileName.MonthlyAttendance(exportType, monthName, year)
    });
  }

  getTooltipText(value: any): string {
    if (!value) return '';
    if (value.isHoliday) return 'Holiday';
    if (value.isWeekOff) return 'Week Off';

    let text = `${value.dateStr || ''} (${value.weekdayStr || ''})`;
    if (value.remark) {
      text += `\n${value.remark}`;
    }
    return text;
  }
}
