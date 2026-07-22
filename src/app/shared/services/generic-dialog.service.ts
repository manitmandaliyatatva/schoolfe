import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { DialogOptions } from '../components/generic-dialog/models/config/dialog-config';
import { GenericDialog } from '../components/generic-dialog/generic-dialog';
import { DocumentViewerDialog } from '../components/document-viewer-dialog/document-viewer-dialog';
import { Base64Document } from '../models/document.model';
import FileHelper from '../helpers/file.helper';

type GenericDialogConfig<TData = any, TResult = any> = Omit<MatDialogConfig<DialogOptions<TData, TResult>>, 'data'>;

@Injectable({
  providedIn: 'root',
})
export class GenericDialogService {
  private readonly dialog = inject(MatDialog);

  open<TData = any, TResult = any>(
    options: DialogOptions<TData, TResult> & GenericDialogConfig<TData, TResult>
  ): MatDialogRef<GenericDialog, TResult> {
    const {
      component,
      template,
      title,
      data,
      showHeader,
      showCloseButton,
      closeResult,
      headerClass,
      contentClass,
      footerClass,
      headerActions,
      actions,
      panelClass,
      maxWidth,
      disableClose,
      ...matConfig
    } = options;

    const dialogOptions: DialogOptions<TData, TResult> = {
      component,
      template,
      title,
      data,
      showHeader: showHeader ?? true,
      showCloseButton: showCloseButton ?? true,
      closeResult: closeResult ?? (false as any),
      headerClass,
      contentClass,
      footerClass,
      headerActions,
      actions,
    };

    const resolvedPanelClass = [
      'custom-modal-wrap',
      ...(Array.isArray(panelClass) ? panelClass : panelClass ? [panelClass] : []),
    ];

    return this.dialog.open(GenericDialog, {
      ...matConfig,
      disableClose: disableClose ?? true,
      maxWidth: maxWidth ?? '100vw',
      panelClass: resolvedPanelClass,
      data: dialogOptions,
    });
  }

  openDocumentViewer(data: Base64Document, defaultFileName: string = 'Document'): MatDialogRef<DocumentViewerDialog, any> {
    const fileName = data?.fileName || defaultFileName;
    const normalizedBase64 = FileHelper.normalizeBase64(data?.base64);
    const resolvedContentType = FileHelper.resolveContentType(data?.contentType, fileName, data?.base64);

    const viewerData: Base64Document = {
      base64: normalizedBase64,
      contentType: resolvedContentType,
      fileName
    };

    return this.dialog.open(DocumentViewerDialog, {
      width: '80vw',
      height: '80vh',
      maxWidth: '1200px',
      disableClose: false,
      panelClass: 'document-viewer-panel',
      data: viewerData
    });
  }

  close<TResult = any>(dialogRef: MatDialogRef<GenericDialog, TResult>, result?: TResult): void {
    dialogRef.close(result);
  }

  closeAll(): void {
    this.dialog.closeAll();
  }
}
