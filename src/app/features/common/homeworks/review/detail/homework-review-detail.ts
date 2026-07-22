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
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { AuthStore } from '../../../../../core/store/auth.store';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import {
  CommonDataGrid,
  CommonDataGridColumnConfig,
} from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { SafeImageComponent } from '../../../../../shared/components/safe-image/safe-image.component';
import { API } from '../../../../../shared/constants/api-url';
import { ADMIN_ROUTE } from '../../../../../shared/constants/route.constant';
import FileHelper from '../../../../../shared/helpers/file.helper';
import CommonHelper from '../../../../../core/helpers/common-helper';
import {
  HOMEWORK_CONST,
  HomeWorkStatus
} from '../../homeworks/models/homework.model';
import { CommonDateFormat } from '../../../../../core/constants/date-format.constant';
import { base64DocumentStore } from '../../../../../shared/models/document.model';
import {
  HOMEWORK_REVIEW_CONST,
  HomeworkReviewDetail as HomeworkReviewDetailModel,
  homeworkReviewDetailStore,
  HomeworkReviewStudent,
  SaveHomeworkReviewPayload,
  homeworkStatusUpdateStore
} from '../models/review.model';
import { HomeworkSubmissionViewDialog } from '../../shared/submission-view-dialog/homework-submission-view-dialog';
import { HomeworkStatusChip } from '../../shared/homework-status-chip/homework-status-chip';

@Component({
  selector: 'app-homework-review-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CommonDataGridComponent,
    ButtonComponent,
    SafeImageComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    HomeworkStatusChip,
  ],
  providers: [homeworkReviewDetailStore, base64DocumentStore, DatePipe],
  templateUrl: './homework-review-detail.html',
  styleUrl: './homework-review-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeworkReviewDetail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(homeworkReviewDetailStore);
  readonly statusStore = inject(homeworkStatusUpdateStore);
  private readonly attachmentStore = inject(base64DocumentStore);
  private readonly authStore = inject(AuthStore);
  private readonly datePipe = inject(DatePipe);
  private readonly commonService = inject(CommonHelperService);
  private readonly genericDialog = inject(GenericDialogService);

  readonly systemConst = SYSTEM_CONST;
  readonly reviewConst = HOMEWORK_REVIEW_CONST;
  readonly homeworkConst = HOMEWORK_CONST;
  protected readonly HomeWorkStatus = HomeWorkStatus;

  readonly isEditMode = signal(false);
  readonly saveActionType = signal<'row' | 'all' | null>(null);
  readonly homeworkDetail = signal<HomeworkReviewDetailModel | null>(null);
  readonly studentHomeworks = signal<HomeworkReviewStudent[]>([]);
  readonly attachmentBase64 = signal<string>('');
  readonly attachmentFileName = signal<string>('');

  readonly permission = computed(() => this.commonService.getPermissionByPage());

  readonly formattedDueDate = computed(() => {
    const detail = this.homeworkDetail();
    if (!detail?.dueDate) return '-';
    return this.datePipe.transform(detail.dueDate, 'd MMMM, yyyy') ?? detail.dueDate;
  });
  readonly hasHomeworkAttachment = computed(() => !!this.attachmentBase64() || !!this.attachmentFileName());

  gridConfig!: CommonDataGrid<HomeworkReviewStudent>;

  @ViewChild('studentNameCell', { static: true }) studentNameCell!: TemplateRef<any>;
  @ViewChild('statusCell', { static: true }) statusCell!: TemplateRef<any>;
  @ViewChild('submissionCell', { static: true }) submissionCell!: TemplateRef<any>;
  @ViewChild('remarksCell', { static: true }) remarksCell!: TemplateRef<any>;
  @ViewChild('reviewedByCell', { static: true }) reviewedByCell!: TemplateRef<any>;
  @ViewChild('actionsCell', { static: true }) actionsCell!: TemplateRef<any>;

  readonly backBtnConfig = signal<CommonButtonConfig>({
    variant: 'stroked',
    color: 'basic',
    buttonText: SYSTEM_CONST.ACTION_BUTTONS.BACK,
    cssClasses: ['btn', 'secondary-btn'],
    callback: () => this.navigateBack(),
  });

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
    buttonText: HOMEWORK_REVIEW_CONST.SAVE_ALL_RECORDS,
    icon: 'save',
    cssClasses: ['btn', 'primary-btn'],
    disableCallBack: () => !this.isAllValid() || this.store.isSubmitting(),
    callback: () => this.onSaveAll(),
  });

  readonly viewBtnConfig = computed<CommonButtonConfig>(() => ({
    variant: 'icon',
    color: 'basic',
    icon: 'visibility',
    tooltipText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
    disabled: !this.attachmentBase64(),
    callback: () => this.onViewHomeworkAttachment(),
  }));

  readonly downloadBtnConfig = computed<CommonButtonConfig>(() => ({
    variant: 'icon',
    color: 'basic',
    icon: 'download',
    tooltipText: SYSTEM_CONST.ACTION_BUTTONS.DOWNLOAD,
    disabled: !this.attachmentBase64(),
    visibleCallback: () => this.commonService.getPermissionByPage().canDownload,
    callback: () => this.onDownloadHomeworkAttachment(),
  }));

  readonly refreshBtnConfig = computed<CommonButtonConfig>(() => (CommonHelper.getRefreshButtonConfig(
    () => {
      const homeworkId = this.homeworkDetail()?.homeworkId;
      if (homeworkId) {
        this.loadReviewData(homeworkId);
      }
    }
  )));

  constructor() {
    effect(() => {
      const p = this.commonService.getPermissionByPage();
      if (!p.canView && !p.canUpdate) {
        this.navigateBack();
      }
    });

    effect(() => {
      const data = this.store.data();
      if (!data) return;

      this.homeworkDetail.set(data);
      this.studentHomeworks.set(data.homeworks ? [...data.homeworks] : []);
      this.attachmentBase64.set(data.attachment || '');
      this.attachmentFileName.set(data.attachmentFileName || '');
      this.gridConfig = this.buildGridConfig();

      if (!data.attachment && data.attachmentFileName && data.homeworkId) {
        this.attachmentStore.getById({
          endpoint: API.ADMIN.HOMEWORK.GET_ATTACHMENT_BASE64,
          params: { homeworkId: data.homeworkId },
        });
      }
    });

    effect(() => {
      const type = this.saveActionType();
      if (!type || !this.store.isSuccess()) return;

      this.saveActionType.set(null);
      if (type === 'all') {
        this.navigateBack();
        return;
      }

      const homeworkId = this.homeworkDetail()?.homeworkId;
      if (homeworkId) {
        this.loadReviewData(homeworkId);
      }
    });

    effect(() => {
      const data = this.attachmentStore.data() as unknown as Record<string, unknown> | null;
      if (!data) return;

      const rawBase64 =
        data['base64'] ?? data['Base64'] ?? data['base64Data'] ?? data['Base64Data'];
      const parsedBase64 = typeof rawBase64 === 'string' ? rawBase64 : '';
      const payload = FileHelper.parseBase64Payload(parsedBase64);
      this.attachmentBase64.set(payload?.base64 || parsedBase64);

      const fileName = data['fileName'] ?? data['FileName'];
      if (typeof fileName === 'string' && fileName.trim()) {
        this.attachmentFileName.set(fileName);
      }
    });
  }

  ngOnInit(): void {
    this.store.resetState();
    this.attachmentStore.resetState();

    const url = this.router.url;
    const isCurrent = this.authStore.iscurrentacademicyear() !== false;
    this.isEditMode.set(url.includes('/edit/') && isCurrent);

    const homeworkId = this.route.snapshot.paramMap.get('id');
    if (!CommonHelper.isEmpty(homeworkId)) {
      this.loadReviewData(homeworkId!);
    }
  }

  loadReviewData = (homeworkId: string): void => {
    this.store.getById({
      endpoint: API.ADMIN.HOMEWORK.REVIEW_DETAILS,
      params: { homeworkId },
    });
  }

  buildGridConfig = (): CommonDataGrid<HomeworkReviewStudent> => {
    const columns = this.isEditMode() ? this.buildEditColumns() : this.buildViewColumns();

    return {
      id: 'homework-review-detail-grid',
      primaryKey: 'studentId',
      columns,
      features: {
        showPagination: false,
        showSearch: false,
        toolbar: {
          buttonConfig: [this.refreshBtnConfig()]
        }
      },
      data: this.studentHomeworks(),
    };
  }

  buildViewColumns = (): CommonDataGridColumnConfig<HomeworkReviewStudent>[] => {
    return [
      {
        title: HOMEWORK_REVIEW_CONST.STUDENT_NAME,
        field: 'fullName',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.studentNameCell,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'status',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.statusCell,
      },
      {
        title: HOMEWORK_REVIEW_CONST.SUBMISSION,
        field: 'homeworkStudentId',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.submissionCell,
      },
      {
        title: HOMEWORK_REVIEW_CONST.REMARKS,
        field: 'remark',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.remarksCell,
      },
      {
        title: HOMEWORK_REVIEW_CONST.REVIEWED_BY,
        field: 'reviewedByUserName',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.reviewedByCell,
      },
    ];
  }

  buildEditColumns = (): CommonDataGridColumnConfig<HomeworkReviewStudent>[] => {
    return [
      {
        title: HOMEWORK_REVIEW_CONST.STUDENT_NAME,
        field: 'fullName',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.studentNameCell,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'status',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.statusCell,
      },
      {
        title: HOMEWORK_REVIEW_CONST.SUBMISSION,
        field: 'homeworkStudentId',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.submissionCell,
      },
      {
        title: HOMEWORK_REVIEW_CONST.REMARKS,
        field: 'remark',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.remarksCell,
      },
      {
        title: HOMEWORK_REVIEW_CONST.ACTIONS,
        field: 'studentId',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.actionsCell,
      },
    ];
  }

  isSubmissionAvailable = (row: HomeworkReviewStudent): boolean => {
    return !!row.homeworkStudentId;
  }

  isRowValid = (row: HomeworkReviewStudent): boolean => {
    return !!row.homeworkStudentId;
  }

  isAllValid = (): boolean => {
    const reviewableRows = this.studentHomeworks().filter((x) => !!x.homeworkStudentId);
    if (reviewableRows.length === 0) return false;
    return reviewableRows.every((m) => this.isRowValid(m));
  }

  onRemarksChange = (row: HomeworkReviewStudent, value: string): void => {
    row.remark = value || null;
  }

  onAcceptRow = (row: HomeworkReviewStudent): void => {
    const payload = this.buildPayload([row]);
    this.saveReview(payload, 'row');
  }

  onChangeStatus = (row: HomeworkReviewStudent, statusId: number): void => {
    if (!row.homeworkStudentId) return;

    this.saveActionType.set('row');
    this.statusStore.create({
      endpoint: API.ADMIN.HOMEWORK.CHANGE_HOMEWORK_STATUS,
      body: {
        homeworkStudentId: row.homeworkStudentId,
        statusId: statusId,
        remark: row.remark ?? null
      },
    });
  }

  onSaveAll = (): void => {
    const payload = this.buildPayload(this.studentHomeworks());
    this.saveReview(payload, 'all');
  }

  buildPayload = (list: HomeworkReviewStudent[]): SaveHomeworkReviewPayload[] => {
    const detail = this.homeworkDetail();
    return list
      .filter((item) => !!item.homeworkStudentId)
      .map((item) => ({
        homeworkStudentId: item.homeworkStudentId,
        homeworkId: detail?.homeworkId ?? null,
        studentId: item.studentId,
        marks: null,
        remark: item.remark ?? '',
      }));
  }

  saveReview = (payload: SaveHomeworkReviewPayload[], type: 'row' | 'all'): void => {
    if (!payload.length) return;

    this.saveActionType.set(type);
    this.store.create({
      endpoint: API.ADMIN.HOMEWORK.REVIEW_SAVE_BULK,
      body: payload as any,
    });
  }

  openSubmissionView = (row: HomeworkReviewStudent): void => {
    if (!row.homeworkStudentId) return;

    this.genericDialog.open({
      width: '550px',
      maxWidth: '96vw',
      title: HOMEWORK_REVIEW_CONST.SUBMISSION_VIEW_TITLE,
      component: HomeworkSubmissionViewDialog,
      data: {
        homeworkStudentId: row.homeworkStudentId,
      },
    });
  }

  onViewHomeworkAttachment = (): void => {
    const detail = this.homeworkDetail();
    const base64 = this.attachmentBase64();
    if (!base64) return;

    const objectUrl = FileHelper.base64ToURL(
      base64,
      detail.attachmentContentType || HOMEWORK_CONST.MIME_TYPE_PDF
    );
    if (!objectUrl) return;

    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }

  onDownloadHomeworkAttachment = (): void => {
    const detail = this.homeworkDetail();
    const base64 = this.attachmentBase64();
    if (!base64) return;

    FileHelper.downloadBase64(
      base64,
      this.attachmentFileName() || detail?.attachmentFileName || HOMEWORK_CONST.DEFAULT_FILE_NAME,
      detail.attachmentContentType || HOMEWORK_CONST.MIME_TYPE_PDF
    );
  }

  getFormattedDate = (value: string | Date | null | undefined, format: string = CommonDateFormat.DMMMYYYY_WithComma): string => {
    if (!value) return '-';
    return this.datePipe.transform(value, format) ?? '-';
  }

  navigateBack = (): void => {
    const basePath = `/${this.authStore.roleRoutePath()}/homework/`;
    this.router.navigate([basePath, ADMIN_ROUTE.HOMEWORK.REVIEWS]);
  }

  ngOnDestroy(): void {
    this.store.resetState();
    this.attachmentStore.resetState();
  }
}
