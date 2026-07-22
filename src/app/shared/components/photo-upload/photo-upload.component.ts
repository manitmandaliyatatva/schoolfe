import { ChangeDetectorRef, Component, inject, input, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ControlContainer, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SafeImageComponent } from '../safe-image/safe-image.component';
import { CommonErrorComponent } from '../common-error/common-error.component';
import FileHelper from '../../helpers/file.helper';
import { CommonPhotoUploadConfig } from './model/photo-upload.model';
import { generateGUID } from '../../../core/helpers/form-utils';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [MatIconModule, SafeImageComponent, CommonErrorComponent, NgClass],
  templateUrl: './photo-upload.component.html',
  styleUrl: './photo-upload.component.scss'
})
export class PhotoUploadComponent implements OnInit {
  private controlContainer = inject(ControlContainer);

  inputId = signal("");

  config = input.required<CommonPhotoUploadConfig>();

  formGroup = signal<FormGroup | null>(null);

  formControlName = () => this.config().formControlName;

  allowedExtensions = () => this.config().allowedExtensions && this.config().allowedExtensions.join(",");

  control = () => this.formGroup()?.get(this.formControlName()) ?? null;

  altText = () => this.config().altText || this.config().label || 'Photo';

  currentSrc = () => this.control()?.value || null;

  private readonly allowedMimeTypes = new Set(['image/jpeg', 'image/png']);

  errorConfig = () => {
    const control = this.control();
    if (!control) return undefined;

    return {
      control,
      formStatus: this.formGroup()?.status ?? null,
      controlName: this.config().label
    };
  };

  isError = () => {
    const ctrl = this.control();
    return !!(ctrl?.touched && ctrl?.errors);
  };

  isRequired = () => {
    return !!this.control()?.hasValidator(Validators.required);
  };

  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.inputId.set(generateGUID(this.config().formControlName));
    const fg = this.controlContainer.control as FormGroup;
    this.formGroup.set(fg);
  }

  onFileSelected = (event: Event): void => {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    const normalizedName = file.name.toLowerCase();
    const hasAllowedExtension = this.config().allowedExtensions.some((ext) => normalizedName.endsWith(ext));

    if (!hasAllowedExtension || !this.allowedMimeTypes.has(file.type)) {
      if (input) input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;

      const base64 = FileHelper.extractBase64(result);

      const ctrl = this.control();
      if (ctrl) {
        ctrl.patchValue(base64, { emitEvent: true });
        ctrl.markAsDirty();
      }

      this.config().change?.(base64, file.name);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }
}
