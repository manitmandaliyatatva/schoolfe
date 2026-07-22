import { Component, inject } from '@angular/core';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { carouselStore, ICarousel } from '../model/caousel.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { getDropdownConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { API } from '../../../../../shared/constants/api-url';
import { PublicSettingStore } from '../../../../../core/store/public-setting.store';

@Component({
  selector: 'app-carousel-form',
  imports: [ReactiveFormsModule, DynamicFormComponent, ButtonComponent],
  templateUrl: './carousel-form.html',
  styleUrl: './carousel-form.scss',
})
export class CarouselForm extends BaseFormComponent<ICarousel> {
  private readonly fb = inject(FormBuilder);
  private readonly publicSettingStore = inject(PublicSettingStore);

  protected override formGroup: FormGroup<any> = this.fb.group({
    carouselId: [EMPTY_GUID],
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    buttonText: ['', [Validators.required]],
    buttonLink: ['', [Validators.required]],
    imageUrl: ['', [Validators.required]],
    displayOrder: ['', [Validators.required]],
    photoName: [''],
    isPhotoReplaced: [false]
  });

  protected override formControls: DynamicForm;
  protected override store = inject(carouselStore);

  protected override getByIdEndpoint: string = API.ADMIN.SITE_CONFIGURATION.CAROUSEL.GETBYID;
  protected override entityIdParamKey: string = 'carouselId';

  constructor() {
    super();
    this.store.resetState();
  }

  protected override buildFormControls(): void {
    const maxCarousel = this.publicSettingStore.maxCarousel() || 5;
    const displayOrderOptions = Array.from({ length: maxCarousel }, (_, i) => ({
      text: (i + 1).toString(),
      value: i + 1
    }));

    this.formControls = {
      formSection: [
        {
          title: '',
          controls: [
            {
              control: {
                formControlName: 'imageUrl',
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
              control: getTextboxConfig('Title', 'title', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: getTextboxConfig('Button Text', 'buttonText', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: getTextboxConfig('Button Link', 'buttonLink', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: getTextboxConfig('Description', 'description', undefined, InputType.textarea, 'outline'),
              type: DynamicFormControlType.TextArea,
              class: 'col-12 col-md-6',
            },
            {
              control: getDropdownConfig('displayOrder', 'Display Order', displayOrderOptions),
              type: DynamicFormControlType.DropDown,
              class: 'col-6',
            }
          ]
        }
      ]
    }
  }
  protected override patchForm(data: ICarousel): void {
    this.formGroup.patchValue({
      carouselId: data.carouselId,
      title: data.title,
      description: data.description,
      buttonText: data.buttonText,
      buttonLink: data.buttonLink,
      imageUrl: data.imageUrl,
      displayOrder: data.displayOrder,
    });
  }
  protected override submitForm(): void {
    const payload = {
      ...this.formGroup.value
    };

    this.store.create({
      endpoint: API.ADMIN.SITE_CONFIGURATION.CAROUSEL.ADDUPDATE,
      body: payload as any,
    });
  }
  protected override cancelRoute(): string[] {
    return ['admin/site-configuration/carousel'];
  }

}
