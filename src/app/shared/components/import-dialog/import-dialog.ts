import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { SYSTEM_CONST } from '../../../core/constants/system.constant';
import { getButtonConfig } from '../../functions/config-function';
import { ButtonComponent } from '../button/button.component';
import { CommonButtonConfig } from '../button/model/button.model';
import { base64DocumentStore } from '../../models/document.model';
import FileHelper from '../../helpers/file.helper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ImportDialogData, importFileStore, ImportDialogConsts } from './model/import-dialog.model';
import { CommonHelperService } from '../../../core/services/common-helper.service';

@UntilDestroy()
@Component({
  selector: 'app-import-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ButtonComponent, MatIconModule],
  templateUrl: './import-dialog.html',
  styleUrl: './import-dialog.scss',
})
export class ImportDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<any>);
  protected readonly data = inject<ImportDialogData>(MAT_DIALOG_DATA);
  private readonly exportStore = inject(base64DocumentStore);
  private readonly importStore = inject(importFileStore);
  private readonly commonHelperService = inject(CommonHelperService);

  protected readonly importDialogConst = ImportDialogConsts;
  readonly permission = this.commonHelperService.getPermissionByPage();

  readonly selectedFile = signal<File | null>(null);
  readonly errorFileBase64 = signal<string | null>(null);
  readonly validationError = signal<string | null>(null);
  readonly isDragOver = signal(false);
  readonly isSubmitting = signal(false);

  readonly cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false),
    cssClasses: ['btn', 'secondary-btn'],
    disableCallBack: () => this.isSubmitting()
  });

  readonly importBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onImport(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.IMPORT, true),
    cssClasses: ['btn', 'primary-btn'],
    disableCallBack: () => !this.selectedFile() || this.isSubmitting()
  });

  onDragOver = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  };

  onDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  };

  onDrop = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  };

  onFileSelected = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  };

  private handleFile = (file: File): void => {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      this.selectedFile.set(file);
      this.errorFileBase64.set(null);
      this.validationError.set(null);
    } else {
      this.selectedFile.set(null);
      this.validationError.set(this.importDialogConst.INVALID_FILE_TYPE);
    }
  };

  downloadSample = (): void => {
    if (!this.data.sampleFileEndpoint) return;

    this.isSubmitting.set(true);
    this.exportStore.getWithResult<string>({
      endpoint: this.data.sampleFileEndpoint,
      params: this.data.queryParams
    }).pipe(untilDestroyed(this)).subscribe({
      next: (data: string) => {
        this.isSubmitting.set(false);
        if (data) {
          const fileName = this.data.title.replaceAll(' ', '') + 'SampleFile.xlsx';
          const contentType = FileHelper.resolveContentType(undefined, fileName, data);
          FileHelper.downloadBase64(data, fileName, contentType);
        }
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  };

  downloadErrorFile = (): void => {
    const base64 = this.errorFileBase64();
    if (!base64) return;
    
    const file = this.selectedFile();
    const errorFileName = this.importDialogConst.ERROR_FILE_PREFIX + (file ? file.name : this.importDialogConst.DEFAULT_IMPORT_FILE_NAME);
    const contentType = FileHelper.resolveContentType(undefined, errorFileName, base64);
    FileHelper.downloadBase64(base64, errorFileName, contentType);
  };

  onCancel = (): void => {
    this.dialogRef.close(null);
  };

  onImport = (): void => {
    const file = this.selectedFile();
    if (!file) return;

    this.isSubmitting.set(true);

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        this.isSubmitting.set(false);
        return;
      }

      const base64 = FileHelper.extractBase64(result);

      const payload = {
        fileBase64: base64,
        ...(this.data.queryParams || {})
      };

      this.importStore.createWithResult({
        endpoint: this.data.endpoint,
        body: payload as any
      }).pipe(untilDestroyed(this)).subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          
          if (response && response.isSuccess === false && response.originalFileWithError) {
            this.errorFileBase64.set(response.originalFileWithError);
          } else {
            this.dialogRef.close(true);
          }
        },
        error: (err: any) => {
          this.isSubmitting.set(false);
          const apiResponse = err?.originalError?.error;
          if (apiResponse?.data?.originalFileWithError) {
            this.errorFileBase64.set(apiResponse.data.originalFileWithError);
          }
        }
      });
    };
    
    reader.onerror = () => {
      this.isSubmitting.set(false);
    };
    
    reader.readAsDataURL(file);
  };
}
