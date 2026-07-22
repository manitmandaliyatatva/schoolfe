import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, Injector, OnDestroy, OnInit, signal } from '@angular/core';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { GenericDialog } from '../../../../../shared/components/generic-dialog/generic-dialog';
import { API } from '../../../../../shared/constants/api-url';
import FileHelper from '../../../../../shared/helpers/file.helper';
import { base64DocumentStore } from '../../../../../shared/models/document.model';
import { HOMEWORK_CONST } from '../../homeworks/models/homework.model';
import {
  HOMEWORK_SUBMISSION_VIEW_CONST,
  HomeworkSubmissionViewDetail,
  homeworkSubmissionViewStore,
} from '../models/homework-shared.model';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';

export interface HomeworkSubmissionViewDialogData {
  homeworkStudentId?: string | null;
  homeworkId?: string | null;
}

@Component({
  selector: 'app-homework-submission-view-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, ButtonComponent],
  providers: [homeworkSubmissionViewStore, base64DocumentStore, DatePipe],
  templateUrl: './homework-submission-view-dialog.html',
  styleUrl: './homework-submission-view-dialog.scss',
})
export class HomeworkSubmissionViewDialog implements OnInit, OnDestroy {
  private readonly injector = inject(Injector);
  private readonly dialogRef = inject(MatDialogRef<GenericDialog, boolean>);
  private readonly datePipe = inject(DatePipe);
  readonly store = inject(homeworkSubmissionViewStore);
  private readonly attachmentStore = inject(base64DocumentStore);
  protected readonly systemConst = SYSTEM_CONST;
  protected readonly homeworkConst = HOMEWORK_CONST;
  protected readonly submissionViewConst = HOMEWORK_SUBMISSION_VIEW_CONST;
  protected readonly commonHelperService = inject(CommonHelperService);

  readonly dialogData = this.injector.get<HomeworkSubmissionViewDialogData | null>(
    'DIALOG_DATA',
    null
  );

  readonly detail = signal<HomeworkSubmissionViewDetail | null>(null);
  readonly attachmentBase64 = signal<string>('');


  readonly viewBtnConfig = computed<CommonButtonConfig>(() => ({
    variant: 'icon',
    color: 'basic',
    icon: 'visibility',
    tooltipText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
    callback: () => this.onViewAttachment(),
  }));

  readonly downloadBtnConfig = computed<CommonButtonConfig>(() => ({
    variant: 'icon',
    color: 'basic',
    icon: 'download',
    tooltipText: SYSTEM_CONST.ACTION_BUTTONS.DOWNLOAD,
    visibleCallback: () => this.commonHelperService.getPermissionByPage().canDownload,
    callback: () => this.onDownloadAttachment(),
  }));

  readonly formattedSubmissionDate = computed(() => {
    const value = this.detail()?.submissionDate;
    return value ? this.datePipe.transform(value, 'd MMMM, yyyy') ?? '-' : '-';
  });

  readonly formattedReviewedDate = computed(() => {
    const value = this.detail()?.reviewedDate;
    return value ? this.datePipe.transform(value, 'd MMMM, yyyy') ?? '-' : '-';
  });

  constructor() {
    effect(() => {
      const data = this.store.data();
      if (!data) return;

      this.detail.set(data);

      if (!CommonHelper.isEmpty(data.homeworkStudentId) && data.submissionAttachmentFilePath) {
        this.attachmentStore.getById({
          endpoint: API.ADMIN.HOMEWORK.STUDENT_SUBMISSION_ATTACHMENT_BASE64,
          params: { homeworkStudentId: data.homeworkStudentId },
        });
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
    });
  }

  ngOnInit(): void {
    this.store.resetState();
    this.attachmentStore.resetState();

    if (CommonHelper.isEmpty(this.dialogData?.homeworkStudentId)) {
      if (CommonHelper.isEmpty(this.dialogData?.homeworkId)) return;
    }

    this.store.getById({
      endpoint: API.ADMIN.HOMEWORK.STUDENT_SUBMISSION_BY_ID,
      params: !CommonHelper.isEmpty(this.dialogData?.homeworkStudentId)
        ? { homeworkStudentId: this.dialogData!.homeworkStudentId }
        : { homeworkId: this.dialogData?.homeworkId },
    });
  }

  getStatusText(status: any): string {
    const s = `${status ?? ''}`;
    if (s === '3') return this.systemConst.STATUS.PROGRESS.REVIEWED;
    if (s === '2') return this.systemConst.STATUS.PROGRESS.SUBMITTED;
    return this.systemConst.STATUS.PROGRESS.PENDING;
  }

  onViewAttachment(): void {
    const base64 = this.attachmentBase64();
    if (!base64) return;

    const objectUrl = FileHelper.base64ToURL(base64, HOMEWORK_CONST.MIME_TYPE_PDF);
    if (!objectUrl) return;

    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }

  onDownloadAttachment(): void {
    const base64 = this.attachmentBase64();
    if (!base64) return;

    const fileName =
      this.detail()?.submissionAttachmentFileName || HOMEWORK_CONST.DEFAULT_FILE_NAME;
    FileHelper.downloadBase64(base64, fileName, HOMEWORK_CONST.MIME_TYPE_PDF);
  }

  onClose(): void {
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.store.resetState();
    this.attachmentStore.resetState();
  }
}
