import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EMAIL_VALIDATION_CONST, ExistedType } from '../../../core/models/email-validation.model';

export interface EmailConflictDialogData {
  conflicts: ExistedType[];
}

@Component({
  selector: 'app-email-conflict-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-conflict-dialog.html',
  styleUrl: './email-conflict-dialog.scss',
})
export class EmailConflictDialog {
  protected data = inject<EmailConflictDialogData>(MAT_DIALOG_DATA);
  protected EMAIL_VALIDATION_CONST = EMAIL_VALIDATION_CONST;
}
