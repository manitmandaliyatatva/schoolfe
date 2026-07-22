import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MaterialModule } from '../../../../core/modules/material/material.module';
import CommonHelper from '../../../../core/helpers/common-helper';
import { SYSTEM_CONST } from '../../../../core/constants/system.constant';
import { ToastrHelperService } from '../../../../core/services/toster-helper.service';
import { AuthStore } from '../../../../core/store/auth.store';
import { AcademicYearHelperService } from '../../../../core/services/academic-year-helper.service';
import { CommonDropdownStore } from '../../../../core/store/common-dropdown.store';
import { HttpService } from '../../../../core/services/http.service';
import { IApiResponse, IDataTableResponse } from '../../../../core/models/request.model';
import { CommonDataGridColumnConfig } from '../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { CommonDataGridSortDirection } from '../../../../shared/components/common-data-grid/types/grid.type';
import { GenericDialogService } from '../../../../shared/services/generic-dialog.service';
import { GridBase } from '../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../shared/constants/api-url';
import { TITLES } from '../../../../shared/constants/title.constant';
import { getDateRangeConfig, getDropdownConfig } from '../../../../shared/functions/config-function';
import FileHelper from '../../../../shared/helpers/file.helper';
import { DynamicFormControlType } from '../../../../shared/models/form-control-base.model';
import { HomeworkSubmissionDialog } from '../../../common/homeworks/shared/homework-submission-dialog/homework-submission-dialog';
import { HomeworkSubmissionViewDialog } from '../../../common/homeworks/shared/submission-view-dialog/homework-submission-view-dialog';
import { base64DocumentStore } from '../../../../shared/models/document.model';
import {
  Homework,
  HOMEWORK_CONST,
  HomeWorkStatus,
  homeworkStore,
} from '../../../common/homeworks/homeworks/models/homework.model';
import { HomeworkStatusChip } from '../../../common/homeworks/shared/homework-status-chip/homework-status-chip';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../shared/components/button/model/button.model';
import { DynamicForm } from '../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { buildGridListRequest } from '../../../../shared/helpers/grid.helper';
import { createFilterSidebarController } from '../../../../shared/helpers/filter-sidebar.helper';
import { FilterDrawerComponent } from '../../../../shared/components/filter-drawer/filter-drawer.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { InfiniteScrollDirective } from '../../../../shared/directives/infinite-scroll.directive';
import { DEFAULT_GRID_PAGE_INDEX, DEFAULT_GRID_PAGE_SIZE } from '../../../../shared/components/common-data-grid/constants/grid.constant';

@Component({
  selector: 'app-student-homework-list',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    HomeworkStatusChip,
    ReactiveFormsModule,
    FilterDrawerComponent,
    ButtonComponent,
    SearchInputComponent,
    InfiniteScrollDirective
  ],
  templateUrl: './student-homework-list.html',
  styleUrl: './student-homework-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [homeworkStore, base64DocumentStore, DatePipe],
})
export class StudentHomeworkList extends GridBase<Homework> implements OnInit, OnDestroy {
  protected override store = inject(homeworkStore);
  protected readonly homeWorkStatus = HomeWorkStatus;
  protected readonly systemConst = SYSTEM_CONST;
  protected readonly homeworkConst = HOMEWORK_CONST;
  private readonly homeworkBase64Store = inject(base64DocumentStore);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly authStore = inject(AuthStore);
  private readonly academicYearHelper = inject(AcademicYearHelperService);
  private readonly http = inject(HttpService);
  private readonly fb = inject(FormBuilder);
  private readonly datePipe = inject(DatePipe);

  readonly subjectDropdownList = this.dropdownStore.getList('homeworkFilterSubject');

  readonly homeworks = signal<Homework[]>([]);
  readonly isLoading = signal(false);
  readonly refreshButtonConfig = computed<CommonButtonConfig>(() => (
    CommonHelper.getRefreshButtonConfig(() => this.resetAndLoad())
  ));
  readonly filterSidebar = createFilterSidebarController({
    onApply: () => this.resetAndLoad(),
    onReset: () => this.filterForm.reset(),
  });

  searchControl = new FormControl('');
  filterForm!: FormGroup;
  filterConfig!: DynamicForm;

  private pageIndex = DEFAULT_GRID_PAGE_INDEX;
  private pageSize = DEFAULT_GRID_PAGE_SIZE;
  protected hasMore = true;
  protected isFetching = false;
  
  private readonly toaster = inject(ToastrHelperService);
  private readonly pendingViewRow = signal<Homework | null>(null);
  protected override apiEndpoint = API.ADMIN.HOMEWORK.LIST;
  protected override deleteEndpoint = '';
  protected override primaryKey: keyof Homework = 'homeworkId';
  protected override pageTitle = TITLES.HOMEWORK;
  protected override routeBasePath = `${this.authStore.roleRoutePath()}/homework/homeworks`;
  protected override deleteConfirmTitle = '';
  protected override deleteConfirmMessage = () => '';
  protected override defaultSortColumn = 'dueDate';
  protected override defaultSortOrder: CommonDataGridSortDirection = 'asc';

  get isPastAY(): boolean {
    return this.isPastAcademicYear;
  }

  private readonly genericDialog = inject(GenericDialogService);

  readonly reviewedCount = computed(() => {
    return this.homeworks().filter((h: Homework) => Number(h.studentHomeworkStatus) === 3).length;
  });

  readonly pendingCount = computed(() => {
    return this.homeworks().filter((h: Homework) => !h.studentHomeworkStatus || Number(h.studentHomeworkStatus) === 1).length;
  });

  readonly totalTasksCount = signal(0);

  constructor() {
    super();
    effect(() => {
      const row = this.pendingViewRow();
      if (!row) return;
      if (this.homeworkBase64Store.isLoading()) return;

      const data = this.homeworkBase64Store.data();
      this.pendingViewRow.set(null);
      if (!data) {
        return;
      }

      const contentType = String(
        data.contentType ?? HOMEWORK_CONST.MIME_TYPE_PDF
      );
      const rawBase64 = data.base64;
      const payload = FileHelper.parseBase64Payload(rawBase64);
      const normalizedBase64 = payload?.base64 || rawBase64;

      if (!normalizedBase64) {
        this.toaster.showWarningMessage(HOMEWORK_CONST.MESSAGES.EMPTY_ERROR);
        return;
      }

      const objectUrl = FileHelper.base64ToURL(
        normalizedBase64,
        contentType || payload?.mimeType || HOMEWORK_CONST.MIME_TYPE_PDF
      );
      if (!objectUrl) {
        this.toaster.showErrorMessage(HOMEWORK_CONST.MESSAGES.PREVIEW_ERROR);
        return;
      }

      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    });

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
  }

  override ngOnInit(): void {
    super.ngOnInit();
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

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.homeworkBase64Store.resetState();
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      subjectId: [null],
      assignedDateFrom: [null],
      assignedDateTo: [null],
      dueDateFrom: [null],
      dueDateTo: [null],
    });

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
              control: getDateRangeConfig(
                this.homeworkConst.ASSIGNED_DATE,
                'assignedDateFrom',
                'assignedDateTo',
                'outline',
                false,
                'From',
                'To',
                () => this.academicYearHelper.getAcademicYearStartDate(),
                () => this.academicYearHelper.getDatepickerMaxDate()
              ),
              type: DynamicFormControlType.DateRangePicker,
              class: 'col-12',
            },
            {
              control: getDateRangeConfig(
                SYSTEM_CONST.LABELS.COMMON.DUE_DATE,
                'dueDateFrom',
                'dueDateTo',
                'outline',
                false,
                'From',
                'To',
                () => this.academicYearHelper.getAcademicYearStartDate(),
                () => this.academicYearHelper.getDatepickerMaxDate()
              ),
              type: DynamicFormControlType.DateRangePicker,
              class: 'col-12',
            },
          ],
        },
      ],
    };
  }

  private loadDropdownData = (): void => {
    this.dropdownStore.getDropdown({
      key: 'homeworkFilterSubject',
      endpoint: API.CLASS.SUBJECT_DROPDOWN
    });
  };



  resetAndLoad(): void {
    this.pageIndex = 0;
    this.hasMore = true;
    this.isFetching = false;
    this.homeworks.set([]);
    this.loadMore();
  }

  loadMore(): void {
    if (!this.hasMore || this.isFetching) return;
    this.isFetching = true;
    this.isLoading.set(true);

    const formValues = this.filterForm?.value || {};
    const filterData: Record<string, unknown> = {};

    if (formValues.subjectId) {
      filterData['subjectId'] = formValues.subjectId;
    }
    if (formValues.assignedDateFrom) {
      filterData['assignedDateFrom'] = this.datePipe.transform(formValues.assignedDateFrom, 'yyyy-MM-dd') || '';
    }
    if (formValues.assignedDateTo) {
      filterData['assignedDateTo'] = this.datePipe.transform(formValues.assignedDateTo, 'yyyy-MM-dd') || '';
    }
    if (formValues.dueDateFrom) {
      filterData['dueDateFrom'] = this.datePipe.transform(formValues.dueDateFrom, 'yyyy-MM-dd') || '';
    }
    if (formValues.dueDateTo) {
      filterData['dueDateTo'] = this.datePipe.transform(formValues.dueDateTo, 'yyyy-MM-dd') || '';
    }

    const filter = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      defaultSortingColumn: this.defaultSortColumn || 'dueDate',
      sortOrder: this.defaultSortOrder || 'asc',
      generalSearch: this.searchControl.value || '',
      filterData: Object.keys(filterData).length > 0 ? filterData : undefined,
    };

    const req = buildGridListRequest(filter);

    this.http.post<IApiResponse<IDataTableResponse<Homework>>, any>(
      this.apiEndpoint, req
    ).subscribe({
      next: (response) => {
        const tableData = response?.data;
        const list = tableData?.data ?? [];
        this.totalTasksCount.set(tableData?.recordsFiltered ?? 0);

        if (list.length > 0) {
          this.homeworks.update(prev => [...prev, ...list]);
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
      }
    });

    this.pageIndex++;
  }

  readonly onViewAttachmentClick = (row: Homework): void => {
    if (CommonHelper.isEmpty(row.homeworkId) || !row.attachmentFilePath) return;
    this.pendingViewRow.set(row);
    this.homeworkBase64Store.resetState();
    this.homeworkBase64Store.getById({
      endpoint: API.ADMIN.HOMEWORK.GET_ATTACHMENT_BASE64,
      params: { homeworkId: row.homeworkId },
    });
  };

  readonly onSubmitAssignment = (row: Homework): void => {
    this.genericDialog.open({
      width: '600px',
      title: HOMEWORK_CONST.SUBMISSION.DIALOG_TITLE,
      component: HomeworkSubmissionDialog,
      data: {
        homeworkId: row.homeworkId,
        homeworkStudentId: row.homeworkStudentId,
        homeworkTitle: row.title,
        studentHomeworkStatus: row.studentHomeworkStatus,
      },
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.resetAndLoad();
      }
    });
  };

  readonly onViewSubmission = (row: Homework): void => {
    this.genericDialog.open({
      width: '550px',
      maxWidth: '96vw',
      title: HOMEWORK_CONST.SUBMISSION.VIEW_BUTTON,
      component: HomeworkSubmissionViewDialog,
      data: {
        homeworkStudentId: row.homeworkStudentId,
        homeworkId: row.homeworkId,
      },
    });
  };

  protected override buildColumns = (): CommonDataGridColumnConfig<Homework>[] => [];
}
