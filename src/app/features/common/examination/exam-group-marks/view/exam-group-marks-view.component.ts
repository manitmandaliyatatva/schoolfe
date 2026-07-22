import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { ExportConst, ExportService } from '../../../../../core/services/export.service';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { CommonDateFormat } from '../../../../../core/constants/date-format.constant';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGrid, CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { CommonDropdownComponent } from '../../../../../shared/components/common-dropdown/common-dropdown.component';
import { CommonDropdownConfig } from '../../../../../shared/components/common-dropdown/model/common-dropdown.model';
import { SafeImageComponent } from '../../../../../shared/components/safe-image/safe-image.component';
import { API } from '../../../../../shared/constants/api-url';
import { ADMIN_ROUTE } from '../../../../../shared/constants/route.constant';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { getDropdownConfig } from '../../../../../shared/functions/config-function';
import { MARKS_ENTRY_CONST } from '../models/exam-group-marks.model';
import { examGroupStore } from '../../exam-groups/models/exam-group.model';
import { StudentExamGroupMarkDto, ExamMarkDto, examGroupMarkDetailsStore, publishExamMarksStore } from '../models/exam-group-marks.model';
import { ConfirmationService } from '../../../../../shared/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'app-exam-group-marks-view',
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
    CommonDropdownComponent,
    CommonDataGridComponent,
    ButtonComponent,
    SafeImageComponent,
  ],
  providers: [examGroupStore, examGroupMarkDetailsStore, publishExamMarksStore],
  templateUrl: './exam-group-marks-view.component.html',
  styleUrls: ['./exam-group-marks-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamGroupMarksViewComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly confirmService = inject(ConfirmationService);
  private readonly publishExamMarksStore = inject(publishExamMarksStore);

  protected readonly authStore = inject(AuthStore);
  protected readonly dropdownStore = inject(CommonDropdownStore);
  protected readonly examGroupStore = inject(examGroupStore);
  protected readonly detailsStore = inject(examGroupMarkDetailsStore);
  protected readonly commonDateFormat = CommonDateFormat;
  private readonly commonHelperService = inject(CommonHelperService);
  readonly permission = computed(() => this.commonHelperService.getPermissionByPage());

  readonly classSectionDropdownList = this.dropdownStore.getList('classSectionList');

  // Route parameter state
  readonly examGroupId = signal<string | null>(null);

  // Filter selections
  readonly selectedClassSectionId = signal<string | null>(null);
  readonly studentMarks = signal<StudentExamGroupMarkDto[]>([]);

  // Publish button flags from API
  readonly isPublishBtnVisible = computed(() => {
    return this.detailsStore.data()?.isPublishBtnVisible ?? false;
  });

  readonly isPublishBtnEnable = computed(() => {
    return this.detailsStore.data()?.isPublishBtnEnable ?? false;
  });

  // True when all exams of the first student are marked as published
  readonly isExamPublished = computed(() => {
    const data = this.detailsStore.data();
    if (!data || !data.students || data.students.length === 0) return false;
    const firstStudent = data.students[0];
    if (!firstStudent.exams || firstStudent.exams.length === 0) return false;
    return firstStudent.exams.every(e => e.isMarksPublished === true);
  });

  private readonly exportService = inject(ExportService);

  readonly exportBtnConfig = computed<CommonButtonConfig>(() =>
    this.exportService.getExportButtonConfig(
      () => this.exportMarks(),
      () => this.studentMarks().length === 0 || this.exportService.isExporting() || !this.permission().canExport
    )
  );

  readonly refreshBtnConfig = computed<CommonButtonConfig>(() =>
    CommonHelper.getRefreshButtonConfig(() => this.reloadMarksData())
  );

  private reloadMarksData(): void {
    const examGroupId = this.examGroupId();
    const classSectionId = this.selectedClassSectionId();

    if (examGroupId && classSectionId) {
      this.detailsStore.getById({
        endpoint: API.ADMIN.EXAMINATION.MARKS.GET_EXAM_GROUP_MARK_DETAILS,
        params: { examGroupId, classSectionId },
      });
    }
  }

  private exportMarks = (): void => {
    const examGroupId = this.examGroupId();
    const classSectionId = this.selectedClassSectionId();
    if (!examGroupId || !classSectionId) return;

    this.exportService.export({
      endpoint: API.ADMIN.EXAMINATION.MARKS.EXPORT,
      payload: {
        examGroupId,
        classSectionId,
      },
      defaultFileName: ExportConst.FileName.Marks(this.examGroupStore.data()?.examGroupName),
    });
  }

  readonly systemConst = SYSTEM_CONST;
  readonly marksConst = MARKS_ENTRY_CONST;
  readonly viewInitializedSignal = signal(false);

  readonly gridConfig = computed<CommonDataGrid<StudentExamGroupMarkDto> | null>(() => {
    if (!this.viewInitializedSignal()) return null;
    const marks = this.studentMarks();
    if (!marks || marks.length === 0) return null;

    // Get exams from the first student if available to build dynamic columns
    const exams = marks[0]?.exams || [];

    return {
      id: 'exam-group-marks-view-grid',
      primaryKey: 'studentId',
      columns: this.buildColumns(exams),
      features: {
        showPagination: false,
        showSearch: false,
        toolbar: {
          buttonConfig: [this.refreshBtnConfig(), this.exportBtnConfig()]
        }
      },
      data: marks,
    };
  });

  @ViewChild('studentNameCell', { static: true }) studentNameCell!: TemplateRef<any>;
  @ViewChild('subjectMarkCell', { static: true }) subjectMarkCell!: TemplateRef<any>;
  @ViewChild('overallSummaryCell', { static: true }) overallSummaryCell!: TemplateRef<any>;
  @ViewChild('percentageGradeCell', { static: true }) percentageGradeCell!: TemplateRef<any>;

  readonly filterForm: FormGroup = this.fb.group({
    classSectionId: [null],
  });

  readonly classSections = this.classSectionDropdownList;

  readonly classSectionDropdownConfig = computed<CommonDropdownConfig>(() => ({
    ...getDropdownConfig(
      'classSectionId',
      TITLES.SECTION,
      this.classSections()
    ),
    isFloatLabel: false,
  }));

  readonly backBtnConfig = signal<CommonButtonConfig>({
    variant: 'stroked',
    color: 'basic',
    buttonText: SYSTEM_CONST.ACTION_BUTTONS.BACK,
    cssClasses: ['btn', 'secondary-btn'],
    callback: () => this.navigateBack(),
  });

  readonly publishBtnConfig = computed<CommonButtonConfig>(() => ({
    variant: 'flat',
    color: 'accent',
    buttonText: MARKS_ENTRY_CONST.PUBLISH,
    icon: 'publish',
    cssClasses: ['btn', 'accent-btn'],
    disableCallBack: () => !this.isPublishBtnEnable() || !this.permission().canUpdate,
    callback: () => this.onPublish(),
  }));

  onPublish(): void {
    const examGroupId = this.examGroupId();
    if (!examGroupId) return;

    this.confirmService.confirm({
      title: MARKS_ENTRY_CONST.PUBLISH_TITLE,
      message: MARKS_ENTRY_CONST.PUBLISH_CONFIRM_MSG,
      confirmText: SYSTEM_CONST.ACTION_BUTTONS.CONFIRM,
      cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
    }).pipe(untilDestroyed(this)).subscribe(confirmed => {
      if (confirmed) {
        this.publishExamMarksStore.createWithResult({
          endpoint: `${API.ADMIN.EXAMINATION.MARKS.PUBLISH_EXAM_MARKS}?examGroupId=${encodeURIComponent(examGroupId)}`,
          body: {},
        }).subscribe({
          next: () => this.reloadMarksData(),
        });
      }
    });
  }

  constructor() {
    // React to loaded Exam Group classId and fetch Class Sections
    effect(() => {
      const groupData = this.examGroupStore.data();
      if (groupData && groupData.classId) {
        untracked(() => {
          this.dropdownStore.getDropdown({
            key: 'classSectionList',
            endpoint: API.CLASS.GET_CLASS_SECTION_LIST_BY_CLASS,
            params: { classId: groupData.classId }
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

    // React to selection changes and fetch details (passing subjectId as undefined/null)
    effect(() => {
      const examGroupId = this.examGroupId();
      const classSectionId = this.selectedClassSectionId();

      if (examGroupId && classSectionId) {
        untracked(() => {
          this.detailsStore.getById({
            endpoint: API.ADMIN.EXAMINATION.MARKS.GET_EXAM_GROUP_MARK_DETAILS,
            params: { examGroupId, classSectionId },
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
  }

  ngOnInit(): void {
    if (!this.permission().canView) {
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

    const state = history.state;
    if (state && state.classSectionId) {
      this.filterForm.patchValue({ classSectionId: state.classSectionId });
      this.selectedClassSectionId.set(state.classSectionId);
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

  private buildColumns(exams: ExamMarkDto[]): CommonDataGridColumnConfig<StudentExamGroupMarkDto>[] {
    const cols: CommonDataGridColumnConfig<StudentExamGroupMarkDto>[] = [
      {
        title: MARKS_ENTRY_CONST.STUDENT_NAME,
        field: 'fullName',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.studentNameCell,
      }
    ];

    const groupData = this.examGroupStore.data();
    const groupExams = groupData?.exams || [];

    // Add a column for each exam/subject in the exam group
    exams.forEach(exam => {
      // Find matching schedule in examGroupStore to get the date
      const schedule = groupExams.find(
        ge => String(ge.subjectId).toLowerCase() === String(exam.subjectId).toLowerCase()
      );

      const dateStr = schedule?.examDate ? this.formatHeaderDate(schedule.examDate) : '';
      const dateSub = dateStr ? `<div class="rich-header__date">(${dateStr})</div>` : '';

      const titleHtml = `
        <div class="rich-header">
          <div class="rich-header__subject">${exam.subjectName}</div>
          ${dateSub}
          <div class="rich-header__info">Max: ${exam.maxMarks} | Pass: ${exam.passingMarks}</div>
        </div>
      `;

      cols.push({
        title: titleHtml,
        field: exam.subjectId as any,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.subjectMarkCell,
        alignment: 'center',
      });
    });

    // Add overall total column
    const totalMax = exams.reduce((sum, e) => sum + e.maxMarks, 0);
    const totalTitleHtml = `
      <div class="rich-header">
        <div class="rich-header__subject">${this.systemConst.LABELS.COMMON.TOTAL}</div>
        <div class="rich-header__info" style="font-size: 11px; font-weight: 600; color: #94a3b8; margin-top: 2px;">(Max: ${totalMax})</div>
      </div>
    `;

    cols.push({
      title: totalTitleHtml,
      field: 'studentId', // unique field key
      fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
      customRenderCell: this.overallSummaryCell,
      alignment: 'center',
    });

    // Add percentage / grade column
    const percentageGradeTitleHtml = `
      <div class="rich-header">
        <div class="rich-header__subject">${this.marksConst.PERCENTAGE}</div>
        <div class="rich-header__info" style="font-size: 11px; font-weight: 600; color: #94a3b8; margin-top: 2px;">(${this.marksConst.GRADE})</div>
      </div>
    `;

    cols.push({
      title: percentageGradeTitleHtml,
      field: 'percentageGrade' as any,
      fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
      customRenderCell: this.percentageGradeCell,
      alignment: 'center',
    });

    return cols;
  }

  formatHeaderDate(dateStr: string | Date): string {
    return CommonHelper.toFormattedDate(dateStr as any, 'd MMM' as any);
  }

  getExamMark(row: StudentExamGroupMarkDto, subjectId: string): ExamMarkDto | undefined {
    if (!row || !row.exams) return undefined;
    return row.exams.find(e => String(e.subjectId).toLowerCase() === String(subjectId).toLowerCase());
  }

  getEvaluatedTooltip(mark: ExamMarkDto): string {
    if (!mark) return '';
    const name = mark.lastEvaluatedName
    const date = CommonHelper.toFormattedDate(mark.lastEvaluatedDate as any, CommonDateFormat.DDMMMYYYY_WithSpace);
    let tooltip = date ? `${this.marksConst.EVALUATED_BY}: ${name} on ${date}` : `${this.marksConst.EVALUATED_BY}: ${name}`;
    if (mark.remarks) {
      tooltip += `\nRemarks: ${mark.remarks}`;
    }
    return tooltip;
  }

  getStudentSummary(row: StudentExamGroupMarkDto) {
    if (!row || !row.exams || !row.exams.length) return null;

    let totalObtained = 0;
    let totalMax = 0;
    let hasAbsent = false;
    let hasFailed = false;
    let hasMarks = false;

    row.exams.forEach(e => {
      if (e.isAbsent) {
        hasAbsent = true;
      } else if (e.obtainedMarks !== null && e.obtainedMarks !== undefined) {
        totalObtained += e.obtainedMarks;
        totalMax += e.maxMarks;
        hasMarks = true;
        if (e.obtainedMarks < e.passingMarks) {
          hasFailed = true;
        }
      }
    });

    if (!hasMarks && hasAbsent) {
      return { result: this.marksConst.ABSENT, percentage: null, grade: null, text: this.marksConst.ABSENT, hasFailed: true };
    }
    if (!hasMarks) {
      return null;
    }

    const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 10000) / 100 : 0;
    const grade = CommonHelper.calculateGrade(percentage);
    const result = hasFailed ? this.marksConst.FAIL : this.marksConst.PASS;

    return {
      totalObtained,
      totalMax,
      percentage,
      grade,
      result,
      text: `${totalObtained}/${totalMax}`,
      hasFailed
    };
  }



  navigateBack(): void {
    const basePath = `/${this.authStore.roleRoutePath()}/examination/`;
    this.router.navigate([basePath, ADMIN_ROUTE.EXAMINATION.MARKS]);
  }
}
