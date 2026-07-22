import { Component, effect, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { INotice } from '../../../features/common/communication/notice/model/notice.model';
import { DASHBOARD_SHARED_CONSTANTS } from '../../../core/constants/system.constant';
import { base64DocumentStore } from '../../models/document.model';
import { GenericDialogService } from '../../services/generic-dialog.service';
import { API } from '../../constants/api-url';
import { CommonHelperService } from '../../../core/services/common-helper.service';

@Component({
  selector: 'app-notice-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DatePipe
  ],
  providers: [base64DocumentStore],
  templateUrl: './notice-detail-dialog.html',
  styleUrl: './notice-detail-dialog.scss'
})
export class NoticeDetailDialog {
  private readonly dialogRef = inject(MatDialogRef<NoticeDetailDialog>);
  readonly notice = inject<INotice>(MAT_DIALOG_DATA);
  
  readonly DASHBOARD_CONSTANTS = DASHBOARD_SHARED_CONSTANTS;
  private readonly documentBase64Store = inject(base64DocumentStore);
  private readonly genericDialogService = inject(GenericDialogService);
  private readonly commonService = inject(CommonHelperService);
  readonly permission = computed(() => this.commonService.getPermissionByPage());
  
  private viewingNotice = signal<INotice | null>(null);

  constructor() {
    effect(() => {
      const base64Data = this.documentBase64Store.data();
      const noticeRow = this.viewingNotice();
      
      if (base64Data && noticeRow) {
        this.viewingNotice.set(null);
        this.genericDialogService.openDocumentViewer(base64Data, noticeRow.title || 'Notice');
      }
    });
  }

  viewNoticeDocument(row: INotice): void {
    if (!row.noticeId) return;

    this.viewingNotice.set(row);
    this.documentBase64Store.resetState();
    this.documentBase64Store.getById({
      endpoint: API.ADMIN.COMMUNICATION.NOTICE.DOCUMENT_DOWNLOAD,
      params: { noticeId: row.noticeId }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
