import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { ExportService } from '../../../../../core/services/export.service';
import { HttpService } from '../../../../../core/services/http.service';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGrid, CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { CommonDropdownComponent } from '../../../../../shared/components/common-dropdown/common-dropdown.component';
import { CommonDropdownConfig } from '../../../../../shared/components/common-dropdown/model/common-dropdown.model';
import { SafeImageComponent } from '../../../../../shared/components/safe-image/safe-image.component';
import { API } from '../../../../../shared/constants/api-url';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { ADMIN_ROUTE } from '../../../../../shared/constants/route.constant';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { NoScrollInputDirective } from '../../../../../shared/directives/no-scroll-input.directive';
import { NumericInputDirective } from '../../../../../shared/directives/numeric-input.directive';
import { getDropdownConfig } from '../../../../../shared/functions/config-function';
import { ConfirmationService } from '../../../../../shared/services/dialog.service';

import { examGroupStore } from '../../exam-groups/models/exam-group.model';
import { MARKS_ENTRY_CONST, SaveMarksPayload, StudentExamGroupMarkDto, examGroupMarkDetailsStore } from '../models/exam-group-marks.model';

@UntilDestroy()
@Component({
  selector: 'app-exam-group-marks-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    CommonDropdownComponent,
    CommonDataGridComponent,
    ButtonComponent,
    SafeImageComponent,
    NoScrollInputDirective,
    NumericInputDirective,
  ],
  providers: [examGroupStore, examGroupMarkDetailsStore],
  templateUrl: './exam-group-marks-edit.component.html',
  styleUrls: ['./exam-group-marks-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamGroupMarksEditComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly http = inject(HttpService);
  private readonly confirmService = inject(ConfirmationService);

  protected readonly authStore = inject(AuthStore);
  protected readonly dropdownStore = inject(CommonDropdownStore);
  protected readonly examGroupStore = inject(examGroupStore);
  protected readonly detailsStore = inject(examGroupMarkDetailsStore);
  private readonly commonHelperService = inject(CommonHelperService);
  readonly permission = computed(() => this.commonHelperService.getPermissionByPage());
  readonly isReadOnly = computed(() => !this.permission().canUpdate || (this.isTeacher() && this.isExamPublished()));

  readonly classSectionDropdownList = this.dropdownStore.getList('classSectionList');
  readonly subjectDropdownList = this.dropdownStore.getList('subjectDropdownList');

  // Route parameter state
  readonly examGroupId = signal<string | null>(null);

  // Filter selections
  readonly selectedClassSectionId = signal<string | null>(null);
  readonly selectedSubjectId = signal<string | null>(null);

  readonly studentMarks = signal<StudentExamGroupMarkDto[]>([]);
  readonly saveActionType = signal<'row' | 'all' | 'publish' | null>(null);

  readonly isPublishBtnVisible = computed(() => {
    return this.detailsStore.data()?.isPublishBtnVisible ?? false;
  });

  readonly isPublishBtnEnable = computed(() => {
    return this.detailsStore.data()?.isPublishBtnEnable ?? false;
  });

  readonly isExamPublished = computed(() => {
    const marks = this.studentMarks();
    if (!marks || marks.length === 0) return false;
    const exam = marks[0]?.exams?.[0];
    return exam?.isMarksPublished ?? false;
  });

  private readonly exportService = inject(ExportService);

  readonly refreshBtnConfig = computed<CommonButtonConfig>(() =>
    CommonHelper.getRefreshButtonConfig(() => this.reloadMarksData())
  );


  readonly importBtnConfig = {
    ...this.exportService.getImportButtonConfig(
      () => {
        const exam = this.selectedExam();
        const classSectionId = this.selectedClassSectionId();
        if (!exam || !exam.examId || !classSectionId) return null;
        return {
          title: `${this.systemConst.ACTION_BUTTONS.IMPORT} ${this.marksConst.MARKS}`,
          sampleFileEndpoint: API.SAMPLE_FILE.EXAM_STUDENT,
          endpoint: API.IMPORT_FILE.EXAM_STUDENT,
          queryParams: {
            examId: exam.examId,
            classSectionId: classSectionId,
          },
        };
      },
      () => this.reloadMarksData()
    ),
    disableCallBack: () => this.isTeacher() && this.isExamPublished()
  };

  private reloadMarksData(): void {
    const examGroupId = this.examGroupId();
    const classSectionId = this.selectedClassSectionId();
    const subjectId = this.selectedSubjectId();

    if (examGroupId && classSectionId && subjectId) {
      this.detailsStore.getById({
        endpoint: API.ADMIN.EXAMINATION.MARKS.GET_EXAM_GROUP_MARK_DETAILS,
        params: { examGroupId, classSectionId, subjectId },
      });
    }
  }

  readonly systemConst = SYSTEM_CONST;
  readonly marksConst = MARKS_ENTRY_CONST;
  readonly viewInitializedSignal = signal(false);

  readonly gridConfig = computed<CommonDataGrid<StudentExamGroupMarkDto> | null>(() => {
    if (!this.viewInitializedSignal()) return null;
    const marks = this.studentMarks();
    if (!marks || marks.length === 0) return null;

    return {
      id: 'exam-group-marks-edit-grid',
      primaryKey: 'studentId',
      columns: this.buildColumns(),
      features: {
        showPagination: false,
        showSearch: false,
        toolbar: {
          buttonConfig: [this.refreshBtnConfig(), this.importBtnConfig]
        }
      },
      data: marks,
    };
  });

  @ViewChild('studentNameCell', { static: true }) studentNameCell!: TemplateRef<any>;
  @ViewChild('obtainedMarksCell', { static: true }) obtainedMarksCell!: TemplateRef<any>;
  @ViewChild('percentageCell', { static: true }) percentageCell!: TemplateRef<any>;
  @ViewChild('gradeCell', { static: true }) gradeCell!: TemplateRef<any>;
  @ViewChild('booleanIconCell', { static: true }) booleanIconCell!: TemplateRef<any>;
  @ViewChild('absentCell', { static: true }) absentCell!: TemplateRef<any>;
  @ViewChild('remarksCell', { static: true }) remarksCell!: TemplateRef<any>;
  @ViewChild('resultCell', { static: true }) resultCell!: TemplateRef<any>;
  @ViewChild('actionsCell', { static: true }) actionsCell!: TemplateRef<any>;

  readonly filterForm: FormGroup = this.fb.group({
    classSectionId: [null],
    subjectId: [null],
  });

  // Signals bound directly to dropdown store lists
  readonly classSections = this.classSectionDropdownList;
  readonly subjects = this.subjectDropdownList;
  readonly isTeacher = this.authStore.isTeacher;

  // Selected exam details
  readonly selectedExam = computed<any>(() => {
    const group = this.examGroupStore.data();
    const subjectId = this.selectedSubjectId();
    if (!group || !group.exams || !subjectId) return null;
    const cleanTarget = String(subjectId).toLowerCase().trim();
    return group.exams.find(e => String(e.subjectId).toLowerCase().trim() === cleanTarget) || null;
  });

  readonly classSectionDropdownConfig = computed<CommonDropdownConfig>(() => ({
    ...getDropdownConfig(
      'classSectionId',
      TITLES.SECTION,
      this.classSections()
    ),
    isFloatLabel: false,
  }));

  readonly subjectDropdownConfig = computed<CommonDropdownConfig>(() => ({
    ...getDropdownConfig(
      'subjectId',
      MARKS_ENTRY_CONST.SUBJECT,
      this.subjects()
    ),
    isFloatLabel: false,
  }));

  readonly cancelBtnConfig = signal<CommonButtonConfig>({
    variant: 'stroked',
    color: 'basic',
    buttonText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
    cssClasses: ['btn', 'secondary-btn'],
    callback: () => this.navigateBack(),
  });

  readonly saveAllBtnConfig = signal<CommonButtonConfig>({
    variant: 'flat',
    color: 'primary',
    buttonText: MARKS_ENTRY_CONST.SAVE_ALL_RECORDS,
    icon: 'save',
    cssClasses: ['btn', 'primary-btn'],
    disableCallBack: () => !this.isAllValid() || this.detailsStore.isSubmitting() || (this.isTeacher() && this.isExamPublished()),
    callback: () => this.onSaveAll(),
  });

  readonly publishBtnConfig = signal<CommonButtonConfig>({
    variant: 'flat',
    color: 'accent',
    buttonText: MARKS_ENTRY_CONST.SAVE_AND_PUBLISH,
    icon: 'publish',
    cssClasses: ['btn', 'accent-btn'],
    disableCallBack: () => !this.isPublishBtnEnable() || !this.isAllValid() || this.studentMarks().length === 0 || this.detailsStore.isSubmitting() || (this.isTeacher() && this.isExamPublished()),
    callback: () => this.onPublish(),
  });

  constructor() {
    // React to loaded Exam Group classId and fetch Class Sections
    effect(() => {
      const groupData = this.examGroupStore.data();
      if (groupData && groupData.classId) {
        untracked(() => {
          this.dropdownStore.getDropdown({
            key: 'classSectionList',
            endpoint: 'ExamStudent/GetClassSectionListByExamGroup',
            params: { examGroupId: this.examGroupId() }
          });
        });
      }
    });

    // React to classroom options and auto-select first section
    effect(() => {
      const sections = this.classSections();
      untracked(() => {
        if (sections.length && !this.filterForm.controls['classSectionId'].value) {
          const firstVal = sections[0].value;
          this.filterForm.patchValue({ classSectionId: firstVal });
          this.selectedClassSectionId.set(String(firstVal));
        }
      });
    });

    // React to selections and fetch subject options dynamically
    effect(() => {
      const examGroupId = this.examGroupId();
      const classSectionId = this.selectedClassSectionId();

      if (examGroupId && classSectionId) {
        untracked(() => {
          this.dropdownStore.getDropdown({
            key: 'subjectDropdownList',
            endpoint: API.ADMIN.EXAMINATION.MARKS.GET_EXAM_GROUP_SUBJECT_LIST_DROPDOWN,
            params: { examGroupId, classSectionId },
            force: true
          });
        });
      } else {
        untracked(() => {
          this.dropdownStore.resetKey('subjectDropdownList');
        });
      }
    });

    // React to subject options and auto-select first subject
    effect(() => {
      const subs = this.subjects();
      untracked(() => {
        if (subs.length) {
          const currentVal = this.filterForm.controls['subjectId'].value;
          const exists = subs.some(s => String(s.value).toLowerCase() === String(currentVal).toLowerCase());
          if (!exists) {
            const firstVal = subs[0].value;
            this.filterForm.patchValue({ subjectId: firstVal });
            this.selectedSubjectId.set(String(firstVal));
          }
        } else {
          this.filterForm.patchValue({ subjectId: null });
          this.selectedSubjectId.set(null);
        }
      });
    });

    // React to selection changes and fetch details
    effect(() => {
      const examGroupId = this.examGroupId();
      const classSectionId = this.selectedClassSectionId();
      const subjectId = this.selectedSubjectId();

      if (examGroupId && classSectionId && subjectId) {
        untracked(() => {
          this.detailsStore.getById({
            endpoint: API.ADMIN.EXAMINATION.MARKS.GET_EXAM_GROUP_MARK_DETAILS,
            params: { examGroupId, classSectionId, subjectId },
          });
        });
      }
    });

    // React to loaded student marks details
    effect(() => {
      const data = this.detailsStore.data();
      if (!data) return;

      untracked(() => {
        const dbStudents: StudentExamGroupMarkDto[] = data.students ? JSON.parse(JSON.stringify(data.students)) : [];
        this.studentMarks.set(dbStudents);
        this.cdr.markForCheck();
      });
    });

    // React to successful save action
    effect(() => {
      const actionType = this.saveActionType();
      if (!actionType || !this.detailsStore.isSuccess()) return;

      untracked(() => {
        this.saveActionType.set(null);
        this.detailsStore.clearSuccess();
        this.navigateBack();
      });
    });
  }

  ngOnInit(): void {
    if (!this.permission().canUpdate && !this.permission().canView) {
      this.navigateBack();
      return;
    }
    this.examGroupStore.resetState();
    this.detailsStore.resetState();

    const id = this.route.snapshot.paramMap.get('examGroupId');
    if (id) {
      this.examGroupId.set(id);

      // Load Exam Group Details
      this.examGroupStore.getById({
        endpoint: API.ADMIN.EXAMINATION.EXAM_GROUP.GET,
        params: { examGroupId: id },
      });
    }

    // Handle filter form control changes
    this.filterForm.controls['classSectionId'].valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(val => {
        this.selectedClassSectionId.set(val);
      });

    this.filterForm.controls['subjectId'].valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(val => {
        this.selectedSubjectId.set(val);
      });

    const state = history.state;
    if (state && state.classSectionId) {
      this.filterForm.patchValue({ classSectionId: state.classSectionId });
      this.selectedClassSectionId.set(state.classSectionId);
    }
    if (state && state.subjectId) {
      this.filterForm.patchValue({ subjectId: state.subjectId });
      this.selectedSubjectId.set(state.subjectId);
    }
  }

  ngAfterViewInit(): void {
    this.viewInitializedSignal.set(true);
  }

  ngOnDestroy(): void {
    this.examGroupStore.resetState();
    this.detailsStore.resetState();
    this.dropdownStore.resetState();
  }

  private buildColumns(): CommonDataGridColumnConfig<StudentExamGroupMarkDto>[] {
    return [
      {
        title: MARKS_ENTRY_CONST.STUDENT_NAME,
        field: 'fullName',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.studentNameCell,
      },
      {
        title: MARKS_ENTRY_CONST.OBTAINED_MARKS,
        field: 'obtainedMarks',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.obtainedMarksCell,
      },
      {
        title: MARKS_ENTRY_CONST.PERCENTAGE,
        field: 'percentage',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.percentageCell,
      },
      {
        title: MARKS_ENTRY_CONST.GRADE,
        field: 'grade',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.gradeCell,
      },
      {
        title: MARKS_ENTRY_CONST.RESULT,
        field: 'result',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.resultCell,
      },
      {
        title: MARKS_ENTRY_CONST.ABSENT_LABEL,
        field: 'isAbsent',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.absentCell,
      },
      {
        title: MARKS_ENTRY_CONST.REMARKS,
        field: 'remarks',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.remarksCell,
      },
      {
        title: MARKS_ENTRY_CONST.ACTIONS,
        field: 'actions' as any,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.actionsCell,
      },
    ];
  }

  onMarksChange(row: StudentExamGroupMarkDto, event: Event): void {
    const exam = row.exams[0];
    if (!exam) return;

    const inputElement = event.target as HTMLInputElement;
    let marks = inputElement.value === '' ? null : Number(inputElement.value);
    const maxMarks = this.selectedExam()?.maxMarks ?? 0;

    if (marks !== null && marks > maxMarks) {
      marks = maxMarks;
      inputElement.value = String(maxMarks);
    }

    exam.obtainedMarks = marks;

    if (marks !== null && maxMarks > 0) {
      exam.percentage = Math.round((marks / maxMarks) * 10000) / 100;
      exam.grade = CommonHelper.calculateGrade(exam.percentage);
    } else {
      exam.percentage = null;
      exam.grade = null;
    }
  }

  onAbsentChange(row: StudentExamGroupMarkDto, isAbsent: boolean): void {
    const exam = row.exams[0];
    if (!exam) return;

    exam.isAbsent = isAbsent;
    exam.obtainedMarks = null;
    exam.percentage = null;
    exam.grade = null;
  }

  onRemarksChange(row: StudentExamGroupMarkDto, value: string): void {
    const exam = row.exams[0];
    if (!exam) return;

    exam.remarks = value || null;
  }

  isRowValid(row: StudentExamGroupMarkDto): boolean {
    const exam = row.exams[0];
    if (!exam) return false;
    return exam.isAbsent || (exam.obtainedMarks !== null && exam.obtainedMarks !== undefined && String(exam.obtainedMarks).trim() !== '');
  }

  isAllValid(): boolean {
    return this.studentMarks().every(r => this.isRowValid(r));
  }



  getFormattedPercentage(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : `${value}%`;
  }

  onSaveRow(row: StudentExamGroupMarkDto): void {
    const payload = this.buildPayload([row])[0];
    this.http.post<any, any>(API.ADMIN.EXAMINATION.MARKS.SAVE_SINGLE, payload).subscribe({
      next: (response) => {
        if (response && response.data) {
          const exam = row.exams[0];
          if (exam) {
            exam.examStudentId = response.data;
          }
          this.studentMarks.set([...this.studentMarks()]);
          this.cdr.markForCheck();
        }
      }
    });
  }

  onSaveAll(): void {
    const payload = this.buildPayload(this.studentMarks());
    this.saveMarks(payload, 'all');
  }

  private buildPayload(students: StudentExamGroupMarkDto[]): SaveMarksPayload[] {
    const exam = this.selectedExam();
    const classSectionId = this.selectedClassSectionId() ?? EMPTY_GUID;

    return students.map(s => {
      const se = s.exams[0];
      return {
        examStudentId: se?.examStudentId ?? EMPTY_GUID,
        examId: exam?.examId ?? EMPTY_GUID,
        studentId: s.studentId,
        fullName: s.fullName,
        isAbsent: se?.isAbsent ?? false,
        maxMarks: exam?.maxMarks ?? 0,
        obtainedMarks: se?.obtainedMarks ?? null,
        percentage: se?.percentage ?? null,
        grade: se?.grade ?? '',
        remarks: se?.remarks ?? '',
        classSectionId: classSectionId,
        subjectId: exam?.subjectId ?? EMPTY_GUID,
      } as any;
    });
  }

  private saveMarks(payload: SaveMarksPayload[], type: 'row' | 'all' | 'publish', isPublishAction: boolean = false): void {
    this.saveActionType.set(type);
    this.detailsStore.create({
      endpoint: API.ADMIN.EXAMINATION.MARKS.SAVE_BULK,
      body: {
        marksList: payload,
        isMarksPublished: isPublishAction
      } as any,
    });
  }

  onPublish(): void {
    const exam = this.selectedExam();
    if (!exam || !exam.examId) return;

    this.confirmService.confirm({
      title: MARKS_ENTRY_CONST.PUBLISH_TITLE,
      message: MARKS_ENTRY_CONST.PUBLISH_CONFIRM_MSG,
      confirmText: SYSTEM_CONST.ACTION_BUTTONS.CONFIRM,
      cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL
    }).pipe(untilDestroyed(this)).subscribe(confirmed => {
      if (confirmed) {
        const payload = this.buildPayload(this.studentMarks());
        this.saveMarks(payload, 'publish', true);
      }
    });
  }

  navigateBack(): void {
    const basePath = `/${this.authStore.roleRoutePath()}/examination/`;
    this.router.navigate([basePath, ADMIN_ROUTE.EXAMINATION.MARKS]);
  }
}
