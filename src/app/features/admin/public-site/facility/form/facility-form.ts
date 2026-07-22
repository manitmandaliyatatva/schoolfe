import { Component, inject } from '@angular/core';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { facilityStore, IFacility } from '../models/facility.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { API } from '../../../../../shared/constants/api-url';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getTextboxConfig } from '../../../../../shared/functions/config-function';

@Component({
  selector: 'app-facility-form',
  imports: [ButtonComponent, DynamicFormComponent, ReactiveFormsModule],
  templateUrl: './facility-form.html',
  styleUrl: './facility-form.scss',
})
export class FacilityForm extends BaseFormComponent<IFacility> {
  private readonly fb = inject(FormBuilder);

  protected override formGroup: FormGroup<any> = this.fb.group({
    id: [EMPTY_GUID],
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    icon: ['', [Validators.required]],
    fileName: [''],
    isPhotoReplaced: [false]
  });

  protected override formControls: DynamicForm;
  protected override store = inject(facilityStore);
  protected override getByIdEndpoint: string = API.ADMIN.SITE_CONFIGURATION.FACILITY.GETBYID;
  protected override entityIdParamKey: keyof IFacility = 'id';
  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          title: '',
          controls: [
            {
              control: {
                formControlName: 'icon',
                label: 'Banner',
                altText: SYSTEM_CONST.LABELS.DOCUMENTS.STUDENT_PHOTO,
                fileType: 'image',
                allowedExtensions: ['.png'],
                change: (base64: string, fileName?: string) => {
                  if (fileName)
                    this.formGroup.patchValue({ photoName: fileName });
                  if (this.isEditMode())
                    this.formGroup.patchValue({ isPhotoReplaced: true });
                }
              },
              type: DynamicFormControlType.ImageUpload,
              class: 'col-4',
            },
            {
              control: {
                ...getTextboxConfig('Title', 'title', undefined, InputType.text, 'outline'),
                maxLength: 100
              },
              type: DynamicFormControlType.Text,
              class: 'col-4',
            },
            {
              control: {
                ...getTextboxConfig('Description', 'description', undefined, InputType.textarea, 'outline'),
                maxLength: 500
              },
              type: DynamicFormControlType.TextArea,
              class: 'col-12 col-md-4',
            },
          ]
        }
      ]
    }
  }
  protected override patchForm(data: IFacility): void {
    this.formGroup.patchValue({
      id: data.id,
      title: data.title,
      description: data.description,
      icon: data.icon
    });
  }
  protected override submitForm(): void {
    const payload = {
      ...this.formGroup.value
    };

    this.store.create({
      endpoint: API.ADMIN.SITE_CONFIGURATION.FACILITY.ADDUPDATE,
      body: payload as any,
    });
  }
  protected override cancelRoute(): string[] {
    return ['admin/site-configuration/facility'];
  }

}
