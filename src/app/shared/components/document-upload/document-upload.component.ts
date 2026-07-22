import { ChangeDetectorRef, Component, inject, input, OnInit, signal, effect, DestroyRef, computed } from '@angular/core';
import { map, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlContainer, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonErrorComponent } from '../common-error/common-error.component';
import { DocumentUploadConfig, UploadedDocument } from './model/document-upload.model';
import { generateGUID } from '../../../core/helpers/form-utils';
import FileHelper from '../../helpers/file.helper';
import { Base64Document, base64DocumentStore } from '../../models/document.model';
import { GenericDialogService } from '../../services/generic-dialog.service';
import { SYSTEM_CONST } from '../../../core/constants/system.constant';

import { NgClass } from '@angular/common';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [MatIconModule, CommonErrorComponent, NgClass],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.scss'
})
export class DocumentUploadComponent implements OnInit {
  private controlContainer = inject(ControlContainer);
  private genericDialogService = inject(GenericDialogService);
  private base64Store = inject(base64DocumentStore);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  config = input.required<DocumentUploadConfig>();
  inputId = signal('');
  formGroup = signal<FormGroup | null>(null);
  isDisabled = signal(false);
  isRequired = signal(false);

  /** Tracks uploaded documents for display in the chip list */
  documents = signal<UploadedDocument[]>([]);

  /** Temporary storage for the document being fetched via API */
  private viewingDoc = signal<UploadedDocument | null>(null);

  constructor() {
    effect(() => {
      const resp = this.base64Store.data() as any;
      const currentDoc = this.viewingDoc();

      if (resp && currentDoc) {
        this.viewingDoc.set(null);

        const raw = resp.base64 ?? resp.Base64 ?? resp.base64Data ?? resp.Base64Data ?? (typeof resp === 'string' ? resp : '');
        const parsed = FileHelper.parseBase64Payload(raw);

        const finalBase64 = parsed?.base64 || raw;
        const finalMimeType = parsed?.mimeType || resp.contentType || resp.ContentType || 'application/pdf';
        const fileName = resp.fileName ?? resp.FileName ?? currentDoc.fileName;

        const dialogData: Base64Document = {
          base64: finalBase64,
          contentType: finalMimeType,
          fileName: fileName
        };

        this.genericDialogService.openDocumentViewer(dialogData, fileName);
      }
    });
  }

  // ------- Computed helpers -------

  formControlName = () => this.config().formControlName;

  control = () => this.formGroup()?.get(this.formControlName()) ?? null;

  isMultiple = () => this.config().multiple ?? false;

  isRequiredComputed = () => this.isRequired() || (this.control()?.hasValidator(Validators.required) ?? false);

  buttonText = () => this.config().buttonText ??
    (this.isMultiple()
      ? SYSTEM_CONST.LABELS.FILE_UPLOAD.ADD_FILE
      : (this.documents().length > 0
        ? SYSTEM_CONST.LABELS.FILE_UPLOAD.CHANGE_FILE
        : SYSTEM_CONST.LABELS.FILE_UPLOAD.UPLOAD_FILE));

  allowedExtensions = () =>
    this.config().allowedExtensions?.join(',') ?? '.pdf,.doc,.docx';

  errorConfig = () => {
    const control = this.control();
    if (!control) return undefined;
    return {
      control,
      formStatus: this.formGroup()?.status ?? null,
      controlName: this.config().label,
    };
  };

  isError = () => {
    const ctrl = this.control();
    return !!(ctrl?.touched && ctrl?.errors);
  };

  // ------- Lifecycle -------

  ngOnInit(): void {
    this.inputId.set(generateGUID(this.config().formControlName));
    const fg = this.controlContainer?.control;
    if (fg instanceof FormGroup) {
      this.formGroup.set(fg);

      // Sync UI when form state changes
      fg.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.patchFromControlValue();
        });

      // Track disabled and required state
      const ctrl = this.control();
      this.isDisabled.set(ctrl?.disabled ?? false);
      this.isRequired.set(ctrl?.hasValidator(Validators.required) ?? false);

      if (ctrl) {
        ctrl.statusChanges
          .pipe(
            untilDestroyed(this),
            map(status => status === 'DISABLED'),
            distinctUntilChanged()
          )
          .subscribe(x => this.isDisabled.set(x));

        ctrl.statusChanges
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            // Check if it still has the required validator, but don't overwrite if it was initially required
            if (ctrl.hasValidator(Validators.required)) {
              this.isRequired.set(true);
            }
          });

        // Custom validator to handle "required" state based on filename control
        const fileNameKey = this.config().fileNameParamKey || 'attachmentFileName';
        const fileNameCtrl = fg.get(fileNameKey);

        const originalValidator = ctrl.validator;
        ctrl.setValidators((c) => {
          const errors = originalValidator ? originalValidator(c) : null;
          if (errors && errors['required'] && fileNameCtrl?.value) {
            delete errors['required'];
            return Object.keys(errors).length > 0 ? errors : null;
          }
          return errors;
        });

        if (fileNameCtrl) {
          fileNameCtrl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              ctrl.updateValueAndValidity({ emitEvent: false });
            });
        }
      }
    }

    // Initial hydration
    this.patchFromControlValue();
  }

  // ------- Actions -------

  onFileSelected = (event: Event): void => {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    const normalizedName = file.name.toLowerCase();
    const extensions = this.config().allowedExtensions ?? ['.pdf', '.doc', '.docx'];
    const hasAllowedExtension = extensions.some((ext) => normalizedName.endsWith(ext));
    if (!hasAllowedExtension) {
      if (input) input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;

      const base64 = FileHelper.extractBase64(result);
      const contentType = file.type || 'application/octet-stream';

      const doc: UploadedDocument = {
        fileName: file.name,
        base64,
        contentType,
      };

      if (this.isMultiple()) {
        this.documents.update((docs) => [...docs, doc]);
      } else {
        this.documents.set([doc]);
        // Also update the filename control if it exists (for consistency in single mode)
        const fg = this.formGroup();
        const fileNameKey = this.config().fileNameParamKey || 'attachmentFileName';
        fg?.get(fileNameKey)?.patchValue(file.name, { emitEvent: false });
      }

      this.syncControlValue();
      this.config().onAdd?.(doc);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected
    if (input) input.value = '';
  };

  onView = (doc: UploadedDocument): void => {
    // 1. If user provided a custom onView, use it
    if (this.config().onView) {
      this.config().onView!(doc);
      return;
    }

    // 2. If we already have base64, open viewer immediately
    if (doc.base64) {
      const dialogData: Base64Document = {
        fileName: doc.fileName,
        contentType: doc.contentType,
        base64: doc.base64,
      };
      this.genericDialogService.openDocumentViewer(dialogData, doc.fileName);
      return;
    }

    // 3. If no base64, check if we have an endpoint to fetch it
    const endpoint = this.config().viewEndpoint;
    const idKey = this.config().viewParamKey;

    if (endpoint && idKey && doc.id) {
      this.viewingDoc.set(doc);
      this.base64Store.resetState();
      this.base64Store.getById({
        endpoint: endpoint,
        params: { [idKey]: doc.id }
      });
    } else {
      console.warn('DocumentUpload: No base64 and no view configuration available for', doc);
    }
  };

  onRemove = (doc: UploadedDocument, index: number): void => {
    this.documents.update((docs) => docs.filter((_, i) => i !== index));

    // Clear filename control if it exists (important for single mode cleanup)
    const fg = this.formGroup();
    const fileNameKey = this.config().fileNameParamKey || 'attachmentFileName';
    fg?.get(fileNameKey)?.patchValue(null, { emitEvent: false });

    this.syncControlValue();
    this.config().onRemove?.(doc, index);
  };

  // ------- Internal -------

  private syncControlValue(): void {
    const ctrl = this.control();
    if (!ctrl) return;

    const docs = this.documents();
    if (this.isMultiple()) {
      ctrl.patchValue(docs.length > 0 ? docs : null, { emitEvent: true });
    } else {
      ctrl.patchValue(docs.length > 0 ? docs[0].base64 : null, { emitEvent: true });
    }
    ctrl.markAsDirty();
    ctrl.markAsTouched();
  }

  private patchFromControlValue(): void {
    const ctrl = this.control();
    const fg = this.formGroup();
    const fileNameKey = this.config().fileNameParamKey || 'attachmentFileName';
    const fileNameCtrl = fg?.get(fileNameKey);
    const fileNameValue = fileNameCtrl?.value;

    // Check if what's in the control matches our current documents list
    const currentDocs = this.documents();
    const currentBase64 = this.isMultiple() ? '' : (currentDocs[0]?.base64 || '');

    // If we already have a new base64 in memory that matches the control
    if (ctrl?.value && ctrl.value === currentBase64) {
      return;
    }

    if (ctrl && ctrl.value) {
      if (this.isMultiple() && Array.isArray(ctrl.value)) {
        this.documents.set(ctrl.value as UploadedDocument[]);
      } else if (!this.isMultiple() && typeof ctrl.value === 'string' && ctrl.value.trim()) {
        const fileName = fileNameValue || 'document';
        this.documents.set([
          {
            fileName,
            base64: ctrl.value,
            contentType: this.getContentType(fileName),
          },
        ]);
      }
    } else if (fileNameValue) {
      const idKey = this.config().viewParamKey;
      const idValue = idKey ? fg?.get(idKey)?.value : null;

      this.documents.set([
        {
          fileName: fileNameValue,
          base64: '',
          contentType: this.getContentType(fileNameValue),
          id: (idValue !== null && idValue !== undefined) ? idValue : undefined
        }
      ]);
    }
  }

  private getContentType(fileName: string): string {
    return FileHelper.resolveContentType(null, fileName, null, 'application/octet-stream');
  }
}
