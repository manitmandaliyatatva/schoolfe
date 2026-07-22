import { CommonModule } from "@angular/common";
import { Component, ViewChild, TemplateRef, inject, signal, effect, OnInit, OnDestroy, computed, untracked } from "@angular/core";
import { ReactiveFormsModule, FormBuilder } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule, MatRadioChange } from "@angular/material/radio";
import { MatTableModule } from "@angular/material/table";
import { filter, debounceTime } from "rxjs";
import { SYSTEM_CONST } from "../../../../core/constants/system.constant";
import { CommonHelperService } from "../../../../core/services/common-helper.service";
import { ToastrHelperService } from "../../../../core/services/toster-helper.service";
import { CommonButtonConfig } from "../../../../shared/components/button/model/button.model";
import { CommonDataGridComponent } from "../../../../shared/components/common-data-grid/common-data-grid.component";
import { CommonDataGridFieldDataType } from "../../../../shared/components/common-data-grid/enums/grid.enum";
import { CommonDataGrid, SelectionState } from "../../../../shared/components/common-data-grid/model/common-data-grid.model";
import { DynamicFormComponent } from "../../../../shared/components/dynamic-form/dynamic-form.component";
import { DynamicForm } from "../../../../shared/components/dynamic-form/model/dynamic-form.model";
import { DynamicFormControlType } from "../../../../shared/models/form-control-base.model";
import { API } from "../../../../shared/constants/api-url";
import { getDatePickerConfig } from "../../../../shared/functions/config-function";
import { buildGridToolbarButton, buildGridListRequest } from "../../../../shared/helpers/grid.helper";
import { ExportService } from "../../../../core/services/export.service";
import { attendenceStatusStore, IAttendenceStatus } from "../../configuration/attendence-status/models/attendence-status";
import { ATTENDANCE_CONST, ITeacherAttendanceForm, saveTeacherAttendanceStore, takeTeacherAttendanceStore, TeacherAttendanceDto } from "../../../common/attendance/attendance.model";
import CommonHelper from "../../../../core/helpers/common-helper";
import { SafeImageComponent } from "../../../../shared/components/safe-image/safe-image.component";
import { HolidayHelperService } from "../../../../core/services/holiday-helper.service";
import { AuthStore } from "../../../../core/store/auth.store";
import { AcademicYearHelperService } from "../../../../core/services/academic-year-helper.service";
import { GlobalRefreshService } from "../../../../core/services/global-refresh.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
    selector: 'app-take-teacher-attendance',
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
    templateUrl: './take-teacher-attendance.html',
    styleUrls: ['./take-teacher-attendance.scss']

})
export class TeacherAttandence implements OnInit, OnDestroy {
    @ViewChild('adStatus', { static: true }) adStatus!: TemplateRef<any>;
    @ViewChild('adRemark', { static: true }) adRemark!: TemplateRef<any>;
    @ViewChild('adSave', { static: true }) adSave!: TemplateRef<any>;
    @ViewChild('teacherNameCell', { static: true }) teacherNameCell!: TemplateRef<any>;

    readonly bgColor = "#e3dcdc"
    readonly color = "#999999"
    readonly systemConst = SYSTEM_CONST;

    teacherListGrid!: CommonDataGrid<TeacherAttendanceDto>;

    private readonly fb = inject(FormBuilder);
    private readonly tostr = inject(ToastrHelperService);

    protected checkBoxSelectionState = signal<SelectionState>('notSelected');

    readonly getAttendanceStore = inject(takeTeacherAttendanceStore);
    readonly saveAttandenceStore = inject(saveTeacherAttendanceStore);
    readonly attendanceStatusStore = inject(attendenceStatusStore);
    readonly commonHelperService = inject(CommonHelperService);
    readonly permission = computed(() => this.commonHelperService.getPermissionByPage());
    readonly canSave = computed(() => this.permission().canUpdate || this.permission().canCreate);
    readonly isReadOnly = computed(() => this.isDisablePrevious() || !this.canSave());
    readonly holidayHelperService = inject(HolidayHelperService);
    readonly authStore = inject(AuthStore);
    readonly academicYearHelper = inject(AcademicYearHelperService);
    private readonly globalRefreshService = inject(GlobalRefreshService);
    private readonly exportService = inject(ExportService);

    importBtnConfig = this.exportService.getImportButtonConfig(() => {
        const dateValue = this.formGroup.get('date')?.value;
        if (!dateValue) return null;
        return {
            title: ATTENDANCE_CONST.IMPORT_TEACHER_ATTENDANCE,
            sampleFileEndpoint: API.SAMPLE_FILE.TEACHER_ATTENDANCE,
            endpoint: API.IMPORT_FILE.TEACHER_ATTENDANCE,
            queryParams: { 
                attendanceDate: CommonHelper.toDateOnly(dateValue)
            }
        };
    }, () => {
        const dateValue = this.formGroup.get('date')?.value;
        if (dateValue) {
            this.loadAttendance(dateValue);
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
        const dateValue = this.formGroup.get('date')?.value;
        if (dateValue) {
            this.loadAttendance(dateValue);
        }
    }, true)));

    teachers = signal<TeacherAttendanceDto[]>([]);
    selectedTeachers = signal<TeacherAttendanceDto[]>([]);
    initialTeacher = signal<TeacherAttendanceDto[]>([]);
    isDisablePrevious = signal<boolean>(false);

    dateConfig = signal(getDatePickerConfig(
        'date',
        SYSTEM_CONST.LABELS.COMMON.DATE,
        'outline',
        null,
        () => this.academicYearHelper.getAcademicYearStartDate(),
        () => this.academicYearHelper.getAttendanceMaxDate()
    ));
    formGroup = this.fb.nonNullable.group({
        date: this.fb.control(this.academicYearHelper.getValidAttendanceDate())
    });

    filterFormControls = computed<DynamicForm>(() => ({
        formSection: [
            {
                controls: [
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
        this.formGroup.controls.date.valueChanges.pipe(
            untilDestroyed(this),
            debounceTime(300),
        ).subscribe((date) => {
            if (date && this.formGroup.controls.date.valid) {
                this.checkDisablingLogic(date);
                this.loadAttendance(date);
            }
        });
        effect(() => {
            if (this.getAttendanceStore.isSuccess()) {
                this.teachers.set(this.getAttendanceStore.list());
                this.initialTeacher.set(this.getAttendanceStore.list());
                this.teacherListGrid = this.buildGridConfig(this.getAttendanceStore.list());
            }
        });

    }

    ngOnInit(): void {
        this.loadData();
        this.loadTeacherHolidays();

        this.globalRefreshService.globalRefreshObservable.pipe(
            untilDestroyed(this)
        ).subscribe(() => {
            this.loadData();
            this.formGroup.controls.date.markAsPristine();
            this.loadTeacherHolidays();
            setTimeout(() => {
                this.formGroup.controls.date.setValue(this.academicYearHelper.getValidAttendanceDate());
                this.formGroup.updateValueAndValidity();
            });
        });
    }

    loadTeacherHolidays = (): void => {
        this.holidayHelperService.loadHolidays({
            isForTeacher: true,
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
                this.loadAttendance(nextDate);
            } else {
                this.checkDisablingLogic(this.formGroup.controls.date.value);
                this.loadAttendance(this.formGroup.controls.date.value);
            }
        });
    }

    loadData = (): void => {
        this.attendanceStatusStore.getAll({
            endpoint: API.ADMIN.CONFIGURATION.ATTENDENCE_STATUS.LIST,
            body: buildGridListRequest<IAttendenceStatus>(null)
        });
    }

    buildGridConfig = (dataList: any): CommonDataGrid<TeacherAttendanceDto> => {
        return {
            id: `teacher-grid`,
            primaryKey: 'teacherId' as string,
            checkboxConfig: {
                showCheckboxSelection: !this.isReadOnly(),
                showMasterCheckBox: !this.isReadOnly(),
                getSelectedRows: (included, excluded, state, count) => {
                    this.checkBoxSelectionState.update(() => state);

                    switch (state) {
                        case 'checked':
                            this.selectedTeachers.set(this.teachers());
                            break;
                        case 'notSelected':
                            this.selectedTeachers.set([]);
                            break;

                        case 'intermediate':
                            if (excluded.length > 0) {
                                const excludedIds = new Set(excluded.map(e => e.teacherId));
                                this.selectedTeachers.set(
                                    this.teachers().filter(s => !excludedIds.has(s.teacherId))
                                );
                            } else if (included.length > 0) {
                                this.selectedTeachers.set(included);
                            } else {
                                this.selectedTeachers.set([]);
                            }
                            break;

                        default:
                            this.selectedTeachers.set([]);
                    }
                },
            },
            columns: [
                {
                    field: 'fullName',
                    title: ATTENDANCE_CONST.TEACHER_NAME,
                    customRenderCell: this.teacherNameCell,
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
                    field: 'teacherId',
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

    updateStatus = (id: string, attendanceStatusId: string) => {
        this.teachers.update(list =>
            list.map(s => s.teacherId === id ? { ...s, attendanceStatusId } : s)
        );
        this.teacherListGrid = {
            ...this.teacherListGrid,
            data: this.teachers()
        };
    }

    updateRemark = (id: string, remark: string) => {
        if (!CommonHelper.isEmpty(id)) {
            this.teachers.update(list =>
                list.map(s => s.teacherId === id ? { ...s, remark } : s)
            );
        } else {
            this.selectedTeachers.update(list =>
                list.map(s => ({
                    ...s,
                    remark
                }))
            );
            const updatedStudents = this.teachers().map(student => {
                const updated = this.selectedTeachers().find(s => s.teacherId === student.teacherId);
                return updated ? updated : student;
            });

            this.teachers.set(updatedStudents);
            this.teacherListGrid = {
                ...this.teacherListGrid,
                data: this.teachers()
            };
        }
    }

    trackById = (index: number, item: TeacherAttendanceDto) => {
        return item.teacherId;
    }

    onChange = (event: MatRadioChange): void => {
        this.teachers.update(list =>
            list.map(s => ({
                ...s,
                attendanceStatusId: event.value
            }))
        );

        this.teacherListGrid = {
            ...this.teacherListGrid,
            data: this.teachers()
        };
    }

    onChangeSelected = (event: MatRadioChange): void => {
        this.selectedTeachers.update(list =>
            list.map(s => ({
                ...s,
                attendanceStatusId: event.value
            }))
        );

        const updatedStudents = this.teachers().map(student => {
            const updated = this.selectedTeachers().find(s => s.teacherId === student.teacherId);
            return updated ? updated : student;
        });

        this.teachers.set(updatedStudents);

        this.teacherListGrid = {
            ...this.teacherListGrid,
            data: this.teachers()
        };
    }

    saveAttendance = (teacherId?: string) => {
        const attendanceDate = CommonHelper.toDateOnly(this.formGroup.get('date').value);

        let teachersToSave = this.teachers();

        if (!CommonHelper.isEmpty(teacherId)) {
            // ── Individual Row Save ──────────────────────────────────────
            const teacher = this.teachers().find(s => s.teacherId === teacherId);
            if (!teacher) return;

            // Validation: status must be selected
            if (CommonHelper.isEmpty(teacher.attendanceStatusId)) {
                this.tostr.showErrorMessage(ATTENDANCE_CONST.SELECT_STATUS);
                return;
            }

            // Skip if nothing changed from initial snapshot
            const initial = this.initialTeacher().find(s => s.teacherId === teacherId);
            const hasChanged = !initial
                || initial.attendanceStatusId !== teacher.attendanceStatusId
                || initial.remark !== teacher.remark;

            if (!hasChanged) {
                this.tostr.showWarningMessage(ATTENDANCE_CONST.NO_CHANGES); // or silently return
                return;
            }

            teachersToSave = [teacher];

        } else {
            // ── Bulk Save ────────────────────────────────────────────────
            const selectedTeachers = this.teachers().filter(s => !CommonHelper.isEmpty(s.attendanceStatusId));

            // Validation 1: at least one row must be selected
            if (selectedTeachers.length === 0) {
                this.tostr.showErrorMessage(ATTENDANCE_CONST.SELECT_TEACHER);
                return;
            }

            // Validation 2: all selected rows must have a status
            const missingStatus = selectedTeachers.some(
                s => CommonHelper.isEmpty(s.attendanceStatusId)
            );
            if (missingStatus) {
                this.tostr.showErrorMessage(ATTENDANCE_CONST.SELECT_STATUS);
                return;
            }

            // Only include rows where data actually changed from initial snapshot
            teachersToSave = selectedTeachers.filter(teacher => {
                const initial = this.initialTeacher().find(s => s.teacherId === teacher.teacherId);
                return !initial
                    || initial.attendanceStatusId !== teacher.attendanceStatusId
                    || initial.remark !== teacher.remark;
            });

            // Skip API call if nothing has changed at all
            if (teachersToSave.length === 0) {
                this.tostr.showWarningMessage(ATTENDANCE_CONST.NO_CHANGES);
                return;
            }
        }

        // ── API Call ───────────────────────────────────────────────────
        this.saveAttandenceStore.create({
            endpoint: API.TEACHER.ATTENDANCE.ADDUPDATE,
            body: {
                attendanceDate,
                teachers: teachersToSave
            } satisfies ITeacherAttendanceForm
        });
    };

    loadAttendance = (date: Date) => {
        this.getAttendanceStore.getAll({
            endpoint: API.TEACHER.ATTENDANCE.GET_LIST_FOR_ATTENDANCE,
            params: {
                attendanceDate: new Date(date).toDateString()
            }
        })
    }

    getCountForStatastic = (id: string): number => {
        return this.teachers().filter(item => item.attendanceStatusId === id)?.length;
    }

    ngOnDestroy(): void {
        this.holidayHelperService.clearHolidays();
        this.getAttendanceStore.resetState();
        this.attendanceStatusStore.resetState();
        this.isDisablePrevious.set(false);
    }

    checkDisablingLogic = (date: any): void => {
        if (!date) return;
        
        const shouldDisable = this.academicYearHelper.isAttendanceDisabled(date);

        this.isDisablePrevious.set(shouldDisable);

        if (this.teacherListGrid) {
            this.teacherListGrid = {
                ...this.teacherListGrid,
                checkboxConfig: {
                    ...this.teacherListGrid.checkboxConfig,
                    showCheckboxSelection: !shouldDisable && this.canSave(),
                    showMasterCheckBox: !shouldDisable && this.canSave()
                }
            };
        }
    };
}
