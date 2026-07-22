import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { contactStore } from '../../admin/public-site/contactus/models/contactus.model';
import { DynamicForm } from '../../../shared/components/dynamic-form/model/dynamic-form.model';
import { EMPTY_GUID } from '../../../shared/constants/app.constants';
import { API } from '../../../shared/constants/api-url';
import { getButtonConfig } from '../../../shared/functions/config-function';
import { CommonButtonConfig } from '../../../shared/components/button/model/button.model';
import { SYSTEM_CONST } from '../../../core/constants/system.constant';
import { IMetaInformation, metaStore } from '../../admin/public-site/meta-information/models/meta-information.model';
import { CommonModule } from '@angular/common';
import { ToastrHelperService } from '../../../core/services/toster-helper.service';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  providers: [contactStore]
})
export class Contact {
  private readonly fb = inject(FormBuilder);
  private toaster = inject(ToastrHelperService);


  public formGroup: FormGroup<any> = this.fb.group({
    id: [EMPTY_GUID],
    email: ['', [Validators.required, Validators.maxLength(250)]],
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
    message: ['', [Validators.required]],
  });

  public formControls: DynamicForm;
  public contactStore = inject(contactStore);

  contactData = computed<IMetaInformation | null>(() => {
    return this.metaStore.list()?.[0] ?? null;
  });
  public metaStore = inject(metaStore);
  protected readonly saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(
      () => this.submitForm(),
      'flat',
      'primary',
      SYSTEM_CONST.ACTION_BUTTONS.SAVE,
      true
    ),
    cssClasses: ['btn', 'primary-btn'],
  });

  constructor() {
    effect(() => {
      if (this.contactStore.isSuccess()) {
        this.formGroup.reset();
        this.toaster.showSuccessMessage("Thanks for reaching out! Our team will contact you soon.")
      }
    });
  }

  public submitForm(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    const payload = {
      ...this.formGroup.value
    };

    this.contactStore.create({
      endpoint: API.ADMIN.SITE_CONFIGURATION.CONTACTUS.ADDUPDATE,
      body: payload as any,
    });
  }
}
