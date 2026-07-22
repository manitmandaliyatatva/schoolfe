import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { CommonButtonConfig } from '../button/model/button.model';
import { ButtonComponent } from '../button/button.component';
import { getButtonConfig } from '../../functions/config-function';
import { SYSTEM_CONST } from '../../../core/constants/system.constant';
import { Base64Document } from '../../models/document.model';
import FileHelper from '../../helpers/file.helper';

import { SafeImageComponent } from '../safe-image/safe-image.component';
import { SafeImageConfig } from '../safe-image/model/safe-image.model';
import { CommonHelperService } from '../../../core/services/common-helper.service';

@Component({
  selector: 'app-document-viewer-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, NgxDocViewerModule, ButtonComponent, SafeImageComponent],
  templateUrl: './document-viewer-dialog.html',
  styleUrls: ['./document-viewer-dialog.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DocumentViewerDialog implements OnInit, OnDestroy {
  public readonly noDocumentsMsg = signal(SYSTEM_CONST.MESSAGES.INFO.NO_DOCUMENTS);
  public readonly documentConst = signal(SYSTEM_CONST.LABELS.DOCUMENTS)
  public readonly docUrl = signal<string>('');
  public readonly safeImageConfig = signal<SafeImageConfig>({});
  public readonly isImage = signal<boolean>(false);
  public readonly isPdf = signal<boolean>(false);
  public readonly unsupported = signal<boolean>(false);
  public readonly viewerType = signal<'google' | 'office' | 'mammoth' | 'pdf' | 'url'>('url');
  private blobUrl: string | null = null;
  private readonly commonHelperService = inject(CommonHelperService);

  readonly closeBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onClose(), 'stroked', 'basic', 'Close', false),
    cssClasses: ['btn', 'secondary-btn', 'btn-sm'],
  });

  readonly closeIconBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onClose(), 'icon', 'basic', '', false, undefined, 'close'),
  });

  readonly downloadBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onDownload(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.DOWNLOAD, true),
    cssClasses: ['btn', 'primary-btn'],
    visibleCallback: () => this.commonHelperService.getPermissionByPage().canDownload,
  });

  constructor(
    public dialogRef: MatDialogRef<DocumentViewerDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Base64Document
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.base64) {
      this.isImage.set(this.data.contentType?.startsWith('image/') || false);
      this.isPdf.set(this.data.contentType === 'application/pdf');
      
      const blob = FileHelper.base64ToBlob(this.data.base64, this.data.contentType);
      
      this.blobUrl = URL.createObjectURL(blob);
      this.docUrl.set(this.blobUrl);
      this.safeImageConfig.set({
        src: `data:${this.data.contentType};base64,${this.data.base64}`,
        alt: this.documentConst().IMAGE,
        defaultImage: 'document-fallback.png'
      });
      
      if (this.isPdf()) {
        this.viewerType.set('pdf');
      } else if (!this.isImage()) {
        // Fallback for docx or other using url or mammoth
        if (this.data.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          this.viewerType.set('mammoth'); // requires mammoth viewer if configured, otherwise 'url' 
        } else {
          this.viewerType.set('url'); 
        }
      }
    }
  }

  onClose = (): void => {
    this.dialogRef.close();
  }

  onDownload = (): void => {
    if (this.docUrl()) {
      const link = document.createElement('a');
      link.href = this.docUrl();
      link.download = this.data.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  ngOnDestroy(): void {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }
  }
}
