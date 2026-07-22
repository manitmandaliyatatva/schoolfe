import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonSlideToggleConfig } from '../../../../../shared/components/common-slide-toggle/models/common-slide-toggle.model';
import { FilterDrawerComponent } from '../../../../../shared/components/filter-drawer/filter-drawer.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDateFormat } from '../../../../../core/constants/date-format.constant';
import { AuthStore } from '../../../../../core/store/auth.store';
import { HttpService } from '../../../../../core/services/http.service';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { LookupMnemonics } from '../../../../../shared/constants/lookup-type-ids.constant';
import { buildGridListRequest } from '../../../../../shared/helpers/grid.helper';
import { CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { getDateRangeConfig, getDropdownConfig } from '../../../../../shared/functions/config-function';
import { IApiResponse, IDataTableResponse } from '../../../../../core/models/request.model';
import { Exam, EXAM_CONST, examStore, GroupedExam, examGroupStore, ExamGroup, EXAM_GROUP_CONST } from '../../../../common/examination/exam-groups/models/exam-group.model';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { createFilterSidebarController } from '../../../../../shared/helpers/filter-sidebar.helper';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { ExamDetailViewComponent } from '../../../../common/examination/exam-groups/shared/exam-detail-view/exam-detail-view.component';
import { SearchInputComponent } from '../../../../../shared/components/search-input/search-input.component';
import { InfiniteScrollDirective } from '../../../../../shared/directives/infinite-scroll.directive';
import { DEFAULT_GRID_PAGE_INDEX, DEFAULT_GRID_PAGE_SIZE } from '../../../../../shared/components/common-data-grid/constants/grid.constant';
import { base64DocumentStore } from '../../../../../shared/models/document.model';
import FileHelper from '../../../../../shared/helpers/file.helper';

@Component({
  selector: 'app-student-exam-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    FilterDrawerComponent,
    ButtonComponent,
    SearchInputComponent,
    InfiniteScrollDirective,
  ],
  providers: [examStore, DatePipe, base64DocumentStore],
  templateUrl: './student-exam-list.html',
  styleUrl: './student-exam-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentExamList extends GridBase<ExamGroup> implements OnInit, OnDestroy {
  protected readonly SYSTEM_CONST = SYSTEM_CONST;
  protected readonly EXAM_CONST = EXAM_CONST;
  protected readonly CommonDateFormat = CommonDateFormat;

  protected override store = inject(examGroupStore);
  protected readonly authStore = inject(AuthStore);
  private readonly dropdownStore = inject(CommonDropdownStore);
  protected readonly http = inject(HttpService);
  private readonly fb = inject(FormBuilder);
  private readonly genericDialogService = inject(GenericDialogService);
  private readonly datePipe = inject(DatePipe);
  private readonly docStore = inject(base64DocumentStore);

  readonly pendingDownloadId = signal<string | null>(null);
  readonly showHolidays = signal(true);

  readonly exams = signal<any[]>([]);
  readonly isLoading = signal(false);
  readonly statusDropdownList = this.dropdownStore.getList('examGroupStatus');
  private isDefaultStatusSet = false;
  private listSubscription?: Subscription;
  readonly refreshButtonConfig = computed<CommonButtonConfig>(() => (
    CommonHelper.getRefreshButtonConfig(() => this.resetAndLoad())
  ));
  readonly filterSidebar = createFilterSidebarController({
    onApply: () => this.resetAndLoad(),
    onReset: () => this.resetFilters(),
  });

  readonly expandedGroupIds = signal<Set<string>>(new Set());

  readonly groupedExams = computed<GroupedExam[]>(() => {
    const list = this.exams() as any[];
    const expandedIds = this.expandedGroupIds();

    return list.map((group) => {
      const examsInGroup: any[] = (group.exams as any[] ?? []).map((exam) => ({
        examId: exam.examId,
        examName: group.examGroupName,
        examTypeId: group.examTypeId,
        examTypeName: group.examTypeName,
        classSectionId: '',
        classSectionName: group.classSectionNames || '',
        subjectId: exam.subjectId,
        subjectName: exam.subjectName,
        examDate: exam.examDate,
        startTime: exam.startTime,
        endTime: exam.endTime,
        maxMarks: Number(exam.maxMarks),
        passingMarks: Number(exam.passingMarks),
        isPublished: true,
        isActive: true,
        isHoliday: false,
      }));

      const holidayItems: any[] = [];
      if (group.holidayDates && this.showHolidays()) {
        const datesArray = group.holidayDates
          .split(',')
          .map((d: string) => d.trim())
          .filter((d: string) => !!d);

        datesArray.forEach((dateStr: string, idx: number) => {
          holidayItems.push({
            examId: `holiday_${group.examGroupId}_${idx}`,
            examName: '',
            examTypeId: '',
            examTypeName: '',
            classSectionId: '',
            classSectionName: '',
            subjectId: '',
            subjectName: EXAM_CONST.HOLIDAY,
            examDate: dateStr,
            startTime: '',
            endTime: '',
            maxMarks: 0,
            passingMarks: 0,
            isPublished: true,
            isActive: true,
            isHoliday: true,
          });
        });
      }

      const allItems = [...examsInGroup, ...holidayItems];

      // Sort exams in group by date & time
      allItems.sort((a, b) => {
        const dateA = new Date(a.examDate).getTime();
        const dateB = new Date(b.examDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        
        if (a.isHoliday && !b.isHoliday) return -1;
        if (!a.isHoliday && b.isHoliday) return 1;

        return (a.startTime || '').localeCompare(b.startTime || '');
      });

      const dates = examsInGroup.map(e => new Date(e.examDate).getTime());
      const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date(group.examGroupStartDate);
      const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date(group.examGroupEndDate);

      // Status
      let status = SYSTEM_CONST.STATUS.PROGRESS.UPCOMING;
      if (examsInGroup.length > 0) {
        const firstExam = examsInGroup[0];
        const firstExamDateStr = firstExam.examDate.split('T')[0];
        const firstStart = new Date(`${firstExamDateStr}T${firstExam.startTime}`);

        const lastExam = examsInGroup[examsInGroup.length - 1];
        const lastExamDateStr = lastExam.examDate.split('T')[0];
        const lastEnd = new Date(`${lastExamDateStr}T${lastExam.endTime}`);

        const now = new Date();
        if (now > lastEnd) {
          status = SYSTEM_CONST.STATUS.PROGRESS.COMPLETED;
        } else if (now >= firstStart && now <= lastEnd) {
          status = SYSTEM_CONST.STATUS.PROGRESS.IN_PROGRESS;
        }
      }

      return {
        examGroupId: group.examGroupId,
        examGroupName: group.examGroupName,
        startDate: this.datePipe.transform(minDate, CommonDateFormat.DDMMMYYYY_WithComma) || '',
        endDate: this.datePipe.transform(maxDate, CommonDateFormat.DDMMMYYYY_WithComma) || '',
        isExpanded: expandedIds.has(group.examGroupId),
        exams: allItems,
        examCount: examsInGroup.length,
        status: status
      };
    });
  });

  toggleGroup(groupId: string): void {
    this.expandedGroupIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }

  searchControl = new FormControl('');

  filterForm!: FormGroup;
  filterConfig!: DynamicForm;

  private pageIndex = DEFAULT_GRID_PAGE_INDEX;
  private pageSize = DEFAULT_GRID_PAGE_SIZE;
  protected hasMore = true;
  protected isFetching = false;

  readonly examTypeDropdownList = this.dropdownStore.getList('examExamType');
  readonly subjectDropdownList = this.dropdownStore.getList('examSubject');

  protected override apiEndpoint = API.ADMIN.EXAMINATION.EXAM_GROUP.LIST;
  protected override deleteEndpoint = '';
  protected override primaryKey: keyof ExamGroup = 'examGroupId';
  protected override get pageTitle(): string {
    return TITLES.STUDENT.EXAMS;
  }
  protected override get routeBasePath(): string {
    return 'student/examination/exams';
  }
  protected override deleteConfirmTitle = '';
  protected override deleteConfirmMessage = () => '';

  protected override buildColumns(): CommonDataGridColumnConfig<ExamGroup>[] {
    return [];
  }

  constructor() {
    super();

    // Effect for base64 document download
    effect(() => {
      const examGroupId = this.pendingDownloadId();
      if (!examGroupId) return;
      if (this.docStore.isLoading()) return;

      const fileData = this.docStore.data();
      this.pendingDownloadId.set(null);
      if (!fileData) return;

      if (fileData.base64) {
        const normalizedBase64 = FileHelper.normalizeBase64(fileData.base64);
        FileHelper.downloadBase64(normalizedBase64, fileData.fileName, fileData.contentType);
      }
    });

    // Setup reactivity for dropdowns
    effect(() => {
      const typeOptions = this.examTypeDropdownList();
      untracked(() => {
        if (this.filterConfig) {
          const typeControl = this.filterConfig.formSection[0].controls?.find(
            (c) => (c.control as any).formControlName === 'examTypeId'
          );
          if (typeControl) {
            (typeControl.control as any).data = typeOptions;
            typeControl.control = { ...typeControl.control };
            this.filterConfig = { ...this.filterConfig };
          }
        }
      });
    }, { allowSignalWrites: true });

    effect(() => {
      const subjectOptions = this.subjectDropdownList();
      untracked(() => {
        if (this.filterConfig) {
          const subjectControl = this.filterConfig.formSection[0].controls?.find(
            (c) => (c.control as any).formControlName === 'subjectId'
          );
          if (subjectControl) {
            (subjectControl.control as any).data = subjectOptions;
            subjectControl.control = { ...subjectControl.control };
            this.filterConfig = { ...this.filterConfig };
          }
        }
      });
    }, { allowSignalWrites: true });

    effect(() => {
      const statusOptions = this.statusDropdownList();
      untracked(() => {
        if (this.filterConfig) {
          const statusControl = this.filterConfig.formSection[0].controls?.find(
            (c) => (c.control as any).formControlName === 'status'
          );
          if (statusControl) {
            (statusControl.control as any).data = statusOptions;
            statusControl.control = { ...statusControl.control };
            this.filterConfig = { ...this.filterConfig };
          }
        }
      });
    }, { allowSignalWrites: true });

    effect(() => {
      const statusOptions = this.statusDropdownList();
      if (statusOptions.length > 0 && !this.isDefaultStatusSet) {
        this.isDefaultStatusSet = true;
        const defaultValues = statusOptions
          .filter(opt => opt.mnemonic === EXAM_CONST.STATUS_UPCOMING || opt.mnemonic === EXAM_CONST.STATUS_ONGOING)
          .map(opt => opt.value);
        this.filterForm.patchValue({ status: defaultValues });
        this.resetAndLoad();
      }
    }, { allowSignalWrites: true });
  }

  override ngOnInit(): void {
    if (!this.permission().canList) return;
    super.ngOnInit();

    this.initFilterForm();

    // Listen to search changes
    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.resetAndLoad();
    });

    this.loadDropdownData();
    setTimeout(() => {
      if (!this.isDefaultStatusSet) {
        this.loadMore();
      }
    }, 2000);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.docStore.resetState();
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      examTypeId: [null],
      subjectId: [null],
      examDateFrom: [null],
      examDateTo: [null],
      status: [null],
      showHolidays: [true],
    });

    this.filterConfig = {
      formSection: [
        {
          controls: [
            {
              control: {
                ...getDropdownConfig('examTypeId', EXAM_CONST.EXAM_TYPE, this.examTypeDropdownList()),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12',
            },
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
                ...getDropdownConfig('status', SYSTEM_CONST.LABELS.COMMON.STATUS, this.statusDropdownList(), {
                  allowMultiple: true,
                  showToggleAllCheckbox: true,
                }),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12',
            },
            {
              control: getDateRangeConfig(EXAM_CONST.EXAM_DATE, 'examDateFrom', 'examDateTo'),
              type: DynamicFormControlType.DateRangePicker,
              class: 'col-12',
            },
            {
              control: {
                formControlName: 'showHolidays',
                label: EXAM_GROUP_CONST.SHOW_HOLIDAYS,
              },
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12',
            },
          ],
        },
      ],
    };
  }

  private loadDropdownData(): void {
    if (!this.permission().canList) return;
    this.dropdownStore.getDropdown({
      key: 'examExamType',
      endpoint: API.ADMIN.EXAMINATION.EXAM_TYPE.DROPDOWN,
      params: { isForFilter: true },
    });
    this.dropdownStore.getDropdown({
      key: 'examSubject',
      endpoint: API.CLASS.SUBJECT_DROPDOWN,
      force: true,
    });
    this.dropdownStore.getDropdown({
      key: 'examGroupStatus',
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.ExamGroupStatus },
      mapData: (items: any[]) => items.map(item => ({
        text: item.text,
        value: item.value,
        mnemonic: item.mnemonic
      }))
    });
  }

  onViewDetails(row: Exam): void {
    this.genericDialogService.open({
      title: 'Exam Details',
      component: ExamDetailViewComponent,
      data: row,
      maxWidth: '650px',
    });
  }

  resetAndLoad(): void {
    this.pageIndex = 0;
    this.hasMore = true;
    this.isFetching = false;
    this.exams.set([]);
    this.loadMore();
  }

  resetFilters(): void {
    const statusOptions = this.statusDropdownList();
    const defaultValues = statusOptions
      .filter(opt => opt.mnemonic === EXAM_CONST.STATUS_UPCOMING || opt.mnemonic === EXAM_CONST.STATUS_ONGOING)
      .map(opt => opt.value);

    this.filterForm.reset({
      examTypeId: null,
      subjectId: null,
      examDateFrom: null,
      examDateTo: null,
      status: defaultValues,
      showHolidays: true
    });
  }

  loadMore(): void {
    if (!this.permission().canList) return;
    if (!this.isDefaultStatusSet) return;
    if (!this.hasMore || this.isFetching) return;
    this.isFetching = true;
    this.isLoading.set(true);

    const formValues = this.filterForm?.value || {};
    this.showHolidays.set(!!formValues.showHolidays);

    const filterData: Record<string, unknown> = {};

    if (formValues.examTypeId) {
      filterData['examTypeId'] = formValues.examTypeId;
    }
    if (formValues.subjectId) {
      filterData['subjectId'] = formValues.subjectId;
    }
    if (formValues.examDateFrom) {
      filterData['examDateFrom'] = this.datePipe.transform(formValues.examDateFrom, 'yyyy-MM-dd') || '';
    }
    if (formValues.examDateTo) {
      filterData['examDateTo'] = this.datePipe.transform(formValues.examDateTo, 'yyyy-MM-dd') || '';
    }
    if (formValues.status && formValues.status.length > 0) {
      filterData['status'] = formValues.status;
    }

    const filter = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      defaultSortingColumn: 'examDate',
      sortOrder: 'asc' as const,
      generalSearch: this.searchControl.value || '',
      filterData: Object.keys(filterData).length > 0 ? filterData : undefined,
    };

    const req = buildGridListRequest(filter);

    if (this.listSubscription) {
      this.listSubscription.unsubscribe();
    }

    this.listSubscription = this.http.post<IApiResponse<IDataTableResponse<any>>, any>(
      this.apiEndpoint,
      req
    ).subscribe({
      next: (response) => {
        const tableData = response?.data;
        const list = tableData?.data ?? [];

        if (list.length > 0) {
          this.exams.update((prev) => [...prev, ...list]);
          this.hasMore = list.length === this.pageSize;
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
      },
    });

    this.pageIndex++;
  }

  formatTimeRange(startTime: string, endTime: string): string {
    if (!startTime) return '-';
    const startFormatted = CommonHelper.formatTimeAMPM(startTime);
    if (!endTime) return startFormatted;
    return `${startFormatted} - ${CommonHelper.formatTimeAMPM(endTime)}`;
  }

  getDownloadTimetableButtonConfig(group: GroupedExam): CommonButtonConfig {
    return {
      variant: 'stroked',
      color: 'primary',
      icon: 'download',
      buttonText: EXAM_CONST.DOWNLOAD_TIMETABLE,
      tooltipText: EXAM_CONST.DOWNLOAD_TIMETABLE_TOOLTIP,
      cssClasses: ['download-timetable-btn'],
      callback: () => this.onDownloadTimetable(group.examGroupId),
    };
  }

  onDownloadTimetable(examGroupId: string): void {
    if (!examGroupId) return;
    this.pendingDownloadId.set(examGroupId);
    this.docStore.resetState();
    this.docStore.getById({
      endpoint: API.STUDENT.EXAMINATION.GET_TIMETABLE,
      params: { examGroupId }
    });
  }

}
