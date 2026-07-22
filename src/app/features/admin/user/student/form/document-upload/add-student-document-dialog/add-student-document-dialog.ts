import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonButtonConfig } from '../../../../../../../shared/components/button/model/button.model';
import { ButtonComponent } from '../../../../../../../shared/components/button/button.component';
import { CommonDropdownComponent } from '../../../../../../../shared/components/common-dropdown/common-dropdown.component';
import { CommonDropdownConfig } from '../../../../../../../shared/components/common-dropdown/model/common-dropdown.model';
import { getButtonConfig, getDropdownConfig } from '../../../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../../../shared/models/common.model';
import { SYSTEM_CONST } from '../../../../../../../core/constants/system.constant';
import { DocumentUploadComponent } from '../../../../../../../shared/components/document-upload/document-upload.component';
import { DocumentUploadConfig } from '../../../../../../../shared/components/document-upload/model/document-upload.model';

export interface AddStudentDocumentDialogData {
  documentTypes: ITextValueOption[];
}

export interface AddStudentDocumentDialogResult {
  documentTypeId: string | null;
  documentTypeName: string;
  documentName: string;
  document: string;
}

@Component({
  selector: 'app-add-student-document-dialog',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule, CommonDropdownComponent, ButtonComponent, DocumentUploadComponent],
  templateUrl: './add-student-document-dialog.html',
  styleUrl: './add-student-document-dialog.scss',
})
export class AddStudentDocumentDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<any, AddStudentDocumentDialogResult | null>);
  protected readonly data = inject<AddStudentDocumentDialogData>(MAT_DIALOG_DATA);
  readonly documentTypeDropdownConfig = signal<CommonDropdownConfig>({
    ...getDropdownConfig('documentTypeId', SYSTEM_CONST.LABELS.DOCUMENTS.TYPE, this.data.documentTypes),
    isFloatLabel: false,
  });

  readonly documentUploadConfig = signal<DocumentUploadConfig>({
    formControlName: 'document',
    fileNameParamKey: 'documentName',
    label: SYSTEM_CONST.LABELS.DOCUMENTS.FILE,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    multiple: false,
    customClass: 'document-upload--small',
  });

  readonly saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onSave(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.SAVE, true),
    cssClasses: ['btn', 'primary-btn'],
  });
  readonly cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false),
    cssClasses: ['btn', 'secondary-btn'],
  });

  readonly formGroup = this.fb.group({
    documentTypeId: this.fb.control<string | null>(null, Validators.required),
    documentName: this.fb.control<string | null>(null),
    document: this.fb.control<string | null>(null, Validators.required),
  });

  onCancel = (): void => {
    this.dialogRef.close(null);
  };

  onSave = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const documentTypeId = this.formGroup.controls.documentTypeId.value;
    const documentName = this.formGroup.controls.documentName.value?.trim();
    const document = this.formGroup.controls.document.value;
    const selectedType = this.data.documentTypes.find((item) => String(item.value) === String(documentTypeId));
    if (!selectedType || !document) return;

    this.dialogRef.close({
      documentTypeId,
      documentTypeName: selectedType.text,
      documentName: documentName || selectedType.text,
      document: document,
    });
  };
}

