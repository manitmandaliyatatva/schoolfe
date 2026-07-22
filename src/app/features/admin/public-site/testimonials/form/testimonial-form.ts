import { Component, inject } from '@angular/core';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { ITestimonials, testimonialStore } from '../model/testimonial.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { API } from '../../../../../shared/constants/api-url';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { getTextboxConfig } from '../../../../../shared/functions/config-function';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { Toolbar } from 'ngx-editor';

@Component({
  selector: 'app-testimonial-form',
  imports: [ReactiveFormsModule, DynamicFormComponent, ButtonComponent],
  templateUrl: './testimonial-form.html',
  styleUrl: './testimonial-form.scss',
})
export class TestimonialForm extends BaseFormComponent<ITestimonials> {
  private readonly fb = inject(FormBuilder);

  protected override formGroup: FormGroup<any> = this.fb.group({
    testimonialId: [EMPTY_GUID],
    personName: ['', [Validators.required]],
    designation: ['', [Validators.required]],
    reviewMessage: ['', [Validators.required]],
    rating: [null, [Validators.required]],
    profileImageUrl: ['', [Validators.required]],
    fileName : [''],
    isPhotoReplaced : [false]
  });;

  protected override formControls: DynamicForm;
  protected override store: any = inject(testimonialStore);
  protected override getByIdEndpoint: string = API.ADMIN.SITE_CONFIGURATION.TESTIMONIAL.GETBYID;
  protected override entityIdParamKey: keyof ITestimonials = 'testimonialId';

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          title: '',
          controls: [
            {
              control: {
                formControlName: 'profileImageUrl',
                label: 'Banner',
                altText: SYSTEM_CONST.LABELS.DOCUMENTS.STUDENT_PHOTO,
                fileType: 'image',
                allowedExtensions: ['.jpeg', '.jpg', '.png'],
                change: (base64: string, fileName?: string) => {
                  if (fileName)
                    this.formGroup.patchValue({ photoName: fileName });
                  if (this.isEditMode())
                    this.formGroup.patchValue({ isPhotoReplaced: true });
                }
              },
              type: DynamicFormControlType.ImageUpload,
              class: 'col-6',
            },
            {
              control: getTextboxConfig('Person Name', 'personName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: getTextboxConfig('Designation', 'designation', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: {
                formControlName: 'reviewMessage',
                label: 'Write Review Here',
                placeholder: 'Enter a detailed description...',
                theme: 'minimal',
                toolbar: 'basic',
                showWordCount: false,
                showCharCount: false,
                maxLength: 1000,
                minHeight: '180px'
              },
              type: DynamicFormControlType.TextEditor,
              class: 'col-6',
            },
            {
              control: {
                initialValue: 0,
                readonly: false,
                allowHalf: false,
                size: 25,
                gap: 5,
                label: "Rating",
                filledColor: '#EF9F27',
                formControlName: 'rating'
              },
              type: DynamicFormControlType.StarRating,
              class: 'col-6',
            }
          ]
        }
      ]
    }
  }
  protected override patchForm(data: ITestimonials): void {
    this.formGroup.patchValue({
      testimonialId: data.testimonialId,
      personName: data.personName,
      designation: data.designation,
      reviewMessage: data.reviewMessage,
      rating: data.rating == 0 ? null : data.rating,
      profileImageUrl: data.profileImageUrl
    });
  }
  protected override submitForm(): void {
    const payload = {
      ...this.formGroup.value
    };

    this.store.create({
      endpoint: API.ADMIN.SITE_CONFIGURATION.TESTIMONIAL.ADDUPDATE,
      body: payload as any,
    });
  }
  protected override cancelRoute(): string[] {
    return ['admin/site-configuration/testimonials'];
  }

}
