import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal, untracked, OnDestroy, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { API } from '../../../../../shared/constants/api-url';
import { MyResult, StudentExamKPIDto, GroupedResult, MY_RESULT_CONST } from '../models/my-result.model';
import { HttpService } from '../../../../../core/services/http.service';
import { CommonDateFormat } from '../../../../../core/constants/date-format.constant';
import { IApiResponse, IDataTableResponse, IDataTableResponseWithKpi } from '../../../../../core/models/request.model';
import { buildGridListRequest } from '../../../../../shared/helpers/grid.helper';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { getDateRangeConfig, getDropdownConfig } from '../../../../../shared/functions/config-function';
import { FilterDrawerComponent } from '../../../../../shared/components/filter-drawer/filter-drawer.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';
import { createFilterSidebarController } from '../../../../../shared/helpers/filter-sidebar.helper';
import CommonHelper from '../../../../../core/helpers/common-helper';
import FileHelper from '../../../../../shared/helpers/file.helper';
import { SearchInputComponent } from '../../../../../shared/components/search-input/search-input.component';
import { InfiniteScrollDirective } from '../../../../../shared/directives/infinite-scroll.directive';
import { DEFAULT_GRID_PAGE_INDEX, DEFAULT_GRID_PAGE_SIZE } from '../../../../../shared/components/common-data-grid/constants/grid.constant';
import { MatTooltipModule } from '@angular/material/tooltip';
import { base64DocumentStore } from '../../../../../shared/models/document.model';

@Component({
  selector: 'app-my-result',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    FilterDrawerComponent,
    ButtonComponent,
    SearchInputComponent,
    InfiniteScrollDirective,
  ],
  providers: [DatePipe, base64DocumentStore],
  templateUrl: './my-result.html',
  styleUrl: './my-result.scss',
})
export class MyResultListComponent implements OnInit, OnDestroy {
  protected readonly SYSTEM_CONST = SYSTEM_CONST;
  protected readonly MY_RESULT_CONST = MY_RESULT_CONST;
  protected readonly CommonDateFormat = CommonDateFormat;

  private readonly http = inject(HttpService);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly fb = inject(FormBuilder);
  private readonly datePipe = inject(DatePipe);
  private readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly commonHelperService = inject(CommonHelperService);

  readonly permission = computed(() => this.commonHelperService.getPermissionByPage());
  private readonly certStore = inject(base64DocumentStore);

  private readonly pendingDownloadId = signal<string | null>(null);

  readonly isEditMode = signal(false);
  readonly results = signal<GroupedResult[]>([]);
  readonly statusFilter = signal<'All' | 'Pass' | 'Fail' | 'Absent'>('All');
  readonly kpiData = signal<StudentExamKPIDto | null>(null);
  readonly isLoading = signal(false);
  readonly refreshButtonConfig = computed<CommonButtonConfig>(() => (
    CommonHelper.getRefreshButtonConfig(() => this.resetAndLoad())
  ));

  readonly expandedGroupIds = signal<Set<string>>(new Set());

  readonly groupedResults = computed<GroupedResult[]>(() => this.results());

  toggleGroup(groupId: string): void {
    this.expandedGroupIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }

      this.results.update(groups =>
        groups.map(group =>
          group.examGroupId === groupId
            ? { ...group, isExpanded: newSet.has(groupId) }
            : group
        )
      );

      return newSet;
    });
  }

  formatTimeRange(startTime: string, endTime: string): string {
    if (!startTime) return '-';
    const startFormatted = CommonHelper.formatTimeAMPM(startTime);
    if (!endTime) return startFormatted;
    return `${startFormatted} - ${CommonHelper.formatTimeAMPM(endTime)}`;
  }

  isPassedResult(result: Pick<MyResult, 'isAbsent' | 'obtainedMarks' | 'passingMarks'>): boolean {
    if (result.isAbsent) return false;
    return Number(result.obtainedMarks) >= Number(result.passingMarks);
  }

  isFailedResult(result: Pick<MyResult, 'isAbsent' | 'obtainedMarks' | 'passingMarks'>): boolean {
    if (result.isAbsent) return false;
    return Number(result.obtainedMarks) < Number(result.passingMarks);
  }

  readonly filterSidebar = createFilterSidebarController({
    onApply: () => this.resetAndLoad(),
    onReset: () => this.filterForm.reset(),
  });

  pageTitle = TITLES.STUDENT.MY_RESULTS;
  searchControl = new FormControl('');

  filterForm!: FormGroup;
  filterConfig!: DynamicForm;
  readonly subjectDropdownList = this.dropdownStore.getList('myResultSubject');

  private pageIndex = DEFAULT_GRID_PAGE_INDEX;
  private pageSize = DEFAULT_GRID_PAGE_SIZE;
  protected hasMore = true;
  protected isFetching = false;

  constructor() {
    effect(() => {
      const options = this.subjectDropdownList();
      untracked(() => {
        if (this.filterConfig) {
          const subjectControl = this.filterConfig.formSection[0].controls?.find(c => (c.control as any).formControlName === 'subjectId');
          if (subjectControl) {
            (subjectControl.control as any).data = options;
            subjectControl.control = { ...subjectControl.control };
            this.filterConfig = { ...this.filterConfig };
          }
        }
      });
    }, { allowSignalWrites: true });

    effect(() => {
      const examStudentId = this.pendingDownloadId();
      if (!examStudentId) return;
      if (this.certStore.isLoading()) return;

      const fileData = this.certStore.data();
      this.pendingDownloadId.set(null);
      if (!fileData) return;

      if (fileData.base64) {
        const normalizedBase64 = FileHelper.normalizeBase64(fileData.base64);
        FileHelper.downloadBase64(normalizedBase64, fileData.fileName, fileData.contentType);
      }
    });
  }

  ngOnInit(): void {
    if (!this.permission().canList) return;

    this.initFilterForm();
    this.loadDropdownData();

    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.resetAndLoad();
    });

    this.loadMore();
  }

  initFilterForm(): void {
    this.filterConfig = {
      formSection: [
        {
          controls: [
            {
              control: {
                ...getDropdownConfig('subjectId', SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT, this.subjectDropdownList()),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12',
            },
            {
              control: {
                ...getDateRangeConfig(
                  MY_RESULT_CONST.EXAM_DATE_LABEL,
                  'examDateFrom',
                  'examDateTo'
                ),
                min: () => this.academicYearHelper.getAcademicYearStartDate(),
                max: () => this.academicYearHelper.getDatepickerMaxDate()
              },
              type: DynamicFormControlType.DateRangePicker,
              class: 'col-12',
            },
            {
              control: {
                ...getDateRangeConfig(
                  MY_RESULT_CONST.EVALUATED_DATE_LABEL,
                  'evaluatedDateFrom',
                  'evaluatedDateTo'
                ),
                min: () => this.academicYearHelper.getAcademicYearStartDate(),
                max: () => this.academicYearHelper.getDatepickerMaxDate()
              },
              type: DynamicFormControlType.DateRangePicker,
              class: 'col-12',
            }
          ]
        }
      ]
    };

    const fg = this.fb.group({});
    for (const section of this.filterConfig.formSection) {
      for (const ctrl of (section.controls ?? [])) {
        if (ctrl.type === DynamicFormControlType.DateRangePicker) {
          const dateRange = ctrl.control as any;
          fg.addControl(dateRange.startFormControlName, new FormControl(null));
          fg.addControl(dateRange.endFormControlName, new FormControl(null));
        } else {
          const fcName = (ctrl.control as any).formControlName;
          if (fcName) {
            fg.addControl(fcName, new FormControl(null));
          }
        }
      }
    }
    this.filterForm = fg;
  }

  loadDropdownData(): void {
    if (!this.permission().canList) return;
    this.dropdownStore.getDropdown({
      key: 'myResultSubject',
      endpoint: API.CLASS.SUBJECT_DROPDOWN,
      force: true
    });
  }

  resetAndLoad(): void {
    this.pageIndex = 0;
    this.hasMore = true;
    this.isFetching = false;
    this.results.set([]);
    this.kpiData.set(null);
    this.loadMore();
  }

  loadMore(): void {
    if (!this.permission().canList) return;
    if (!this.hasMore || this.isFetching) return;
    this.isFetching = true;
    this.isLoading.set(true);

    const filter: any = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      defaultSortingColumn: 'startDate',
      sortOrder: 'desc' as const,
      generalSearch: this.searchControl.value || '',
      filterData: this.statusFilter() === 'All' ? null : JSON.stringify({ status: this.statusFilter() }),
    };

    const req = buildGridListRequest(filter);
    req.columns = this.buildFilterColumns();

    this.http.post<IApiResponse<IDataTableResponse<any>>, any>(
      API.STUDENT.EXAMINATION.MY_RESULT, req
    ).subscribe({
      next: (response) => {
        const tableData = response?.data;
        const list = (tableData?.data as any[]) ?? [];

        if (list.length > 0) {
          const expandedIds = this.expandedGroupIds();
          const mapped = list.map(item => this.mapGroupedResult(item, expandedIds));
          const allGroups = [...this.results(), ...mapped];

          this.results.set(allGroups);
          this.hasMore = list.length === this.pageSize;
          
          if (mapped.length > 0 && mapped[0].kpiData) {
            this.kpiData.set(mapped[0].kpiData);
          }
        } else {
          this.hasMore = false;
        }

        this.isFetching = false;
        this.isLoading.set(false);
      },
      error: () => {
        this.isFetching = false;
        this.hasMore = false;
        this.isLoading.set(false);
      }
    });

    this.pageIndex++;
  }

  private buildFilterColumns(): any[] {
    const columns = [];
    const val = this.filterForm.value;

    if (val.subjectId) {
      columns.push({ name: 'subjectid', filterSearch: { value: val.subjectId, type: 'text' } });
    }

    if (val.examDateFrom) {
      columns.push({ name: 'examdatefrom', filterSearch: { value: this.datePipe.transform(val.examDateFrom, 'yyyy-MM-dd'), type: 'date' } });
    }
    if (val.examDateTo) {
      columns.push({ name: 'examdateto', filterSearch: { value: this.datePipe.transform(val.examDateTo, 'yyyy-MM-dd'), type: 'date' } });
    }

    if (val.evaluatedDateFrom) {
      columns.push({ name: 'evaluateddatefrom', filterSearch: { value: this.datePipe.transform(val.evaluatedDateFrom, 'yyyy-MM-dd'), type: 'date' } });
    }
    if (val.evaluatedDateTo) {
      columns.push({ name: 'evaluateddateto', filterSearch: { value: this.datePipe.transform(val.evaluatedDateTo, 'yyyy-MM-dd'), type: 'date' } });
    }

    return columns;
  }

  ngOnDestroy(): void {
    this.certStore.resetState();
  }

  private mapGroupedResult(item: any, expandedIds: Set<string>): GroupedResult {
    const results: MyResult[] = (item.examMarks || []).map((mark: any) =>
      this.mapResult(item, mark)
    );

    return {
      examGroupId: item.examGroupId,
      examGroupName: item.examGroupName,
      startDate: this.datePipe.transform(item.startDate, CommonDateFormat.DDMMMYYYY_WithComma) || '',
      endDate: this.datePipe.transform(item.endDate, CommonDateFormat.DDMMMYYYY_WithComma) || '',
      isExpanded: expandedIds.has(item.examGroupId),
      results,
      totalExams: results.length,
      passedExams: results.filter(result => this.isPassedResult(result)).length,
      averageScore: item.overallPercentage,
      maxGrade: item.overallGrade || '-',
      isDownloadCertificate: !!item.isDownloadCertificate,
      certificateExamStudentId: results.find(result => !!result.examStudentId)?.examStudentId || '',
      kpiData: item.kpiData
    };
  }

  private mapResult(item: any, mark: any): MyResult {
    const obtainedMarks = mark.obtainedMarks ?? 0;
    const maxMarks = mark.maxMarks ?? 0;

    return {
      examStudentId: mark.examStudentId || '',
      examId: mark.examId,
      examName: mark.examName,
      examGroupId: item.examGroupId,
      examGroupName: item.examGroupName,
      studentId: 0,
      fullName: '',
      isAbsent: mark.isAbsent,
      maxMarks,
      obtainedMarks,
      passingMarks: mark.passingMarks,
      percentage: maxMarks > 0 ? Math.round((obtainedMarks / maxMarks) * 10000) / 100 : 0,
      grade: mark.grade || '-',
      remarks: mark.remarks,
      evaluatedBy: 0,
      evaluatedByName: mark.evaluatedByName,
      evaluatedDate: mark.evaluatedDate,
      examDate: mark.examDate,
      startTime: mark.startTime || '',
      endTime: mark.endTime || '',
      classSectionName: '',
      subjectName: mark.subjectName || '',
      isActive: true
    };
  }



  getScoreColorClass(score?: number): string {
    if (score == null) return '';
    if (score >= 90) return 'green';
    if (score >= 75) return 'blue';
    if (score >= 50) return 'orange';
    return 'red';
  }

  getGradeColorClass(grade?: string): string {
    if (!grade || grade === '-') return '';
    const upperGrade = grade.toUpperCase();
    if (upperGrade === 'A') return 'green';
    if (upperGrade === 'B') return 'blue';
    if (upperGrade === 'C') return 'orange';
    return 'red';
  }

  getScoreIcon(score?: number): string {
    if (score == null) return 'star_outline';
    if (score >= 90) return 'star';
    if (score >= 75) return 'star_half';
    if (score >= 50) return 'trending_flat';
    return 'trending_down';
  }

  getGradeIcon(grade?: string): string {
    if (!grade || grade === '-') return 'emoji_events';
    const upperGrade = grade.toUpperCase();
    if (upperGrade === 'A') return 'workspace_premium';
    if (upperGrade === 'B') return 'military_tech';
    if (upperGrade === 'C') return 'thumb_up';
    return 'thumb_down';
  }

  getDownloadCertificateButtonConfig(group: GroupedResult): CommonButtonConfig {
    return {
      variant: 'flat',
      color: 'primary',
      icon: 'download',
      buttonText: MY_RESULT_CONST.RESULT,
      tooltipText: MY_RESULT_CONST.DOWNLOAD_RESULT,
      cssClasses: ['download-result-btn'],
      callback: () => this.onDownloadGroupCertificate(group),
    };
  }

  onDownloadGroupCertificate(group: GroupedResult): void {
    if (!group.isDownloadCertificate || !group.certificateExamStudentId) return;
    this.onDownloadCertificate(group.certificateExamStudentId);
  }

  onDownloadCertificate(examStudentId: string): void {
    if (!examStudentId) return;
    this.pendingDownloadId.set(examStudentId);
    this.certStore.resetState();
    this.certStore.getById({
      endpoint: API.STUDENT.EXAMINATION.GET_CERTIFICATE,
      params: { examStudentId }
    });
  }
}
