import { Component, computed, effect, inject } from '@angular/core';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { IMetaInformation, metaStore } from '../models/meta-information.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { API } from '../../../../../shared/constants/api-url';
import { Router } from '@angular/router';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { getTextboxConfig } from '../../../../../shared/functions/config-function';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { CommonModule } from '@angular/common';
import { buildGridListRequest } from '../../../../../shared/helpers/grid.helper';
import CommonHelper from '../../../../../core/helpers/common-helper';

@Component({
  selector: 'app-meta-information-form',
  imports: [ButtonComponent, DynamicFormComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './meta-information-form.html',
  styleUrl: './meta-information-form.scss',
})
export class MetaInformationForm extends BaseFormComponent<IMetaInformation> {
  private readonly fb = inject(FormBuilder);

  protected override formGroup: FormGroup<any> = this.fb.group({
    metaInformationId: [EMPTY_GUID],
    phoneNo: ['', [Validators.required]],
    addressLine1: ['', [Validators.required]],
    addressLine2: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    country: ['', [Validators.required]],
    pincode: ['', [Validators.required]],
    officialEmail: ['', [Validators.required]],
    aboutContent: ['', [Validators.required]]
  });

  protected override formControls: DynamicForm;
  protected override store = inject(metaStore);
  protected override getByIdEndpoint: string = API.ADMIN.SITE_CONFIGURATION.META_INFORMATION.GETBYID;
  protected override entityIdParamKey: keyof IMetaInformation = 'metaInformationId';

  constructor() {
    super();
    effect(() => {
      if (CommonHelper.isNotEmptyArray(this.store.list())) {
        this.router.navigateByUrl(`/admin/site-configuration/meta-information/edit/${this.store.list()[0].metaInformationId}`)
      }
    })
  }
  override ngOnInit(): void {
    super.ngOnInit();
    this.store.getAll({
      endpoint: API.ADMIN.SITE_CONFIGURATION.META_INFORMATION.LIST,
      body: buildGridListRequest(null),
    });
  }
  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          title: '',
          controls: [
            {
              control: getTextboxConfig('Mobile Number', 'phoneNo', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-4',
            },
            {
              control: getTextboxConfig('Address Line1', 'addressLine1', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-4',
            },
            {
              control: getTextboxConfig('Address Line2', 'addressLine2', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-4',
            },
            {
              control: getTextboxConfig('City', 'city', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-4',
            },
            {
              control: getTextboxConfig('State', 'state', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-4',
            },
            {
              control: getTextboxConfig('Country', 'country', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-4',
            },
            {
              control: getTextboxConfig('Pincode', 'pincode', undefined, InputType.number, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-4',
            },
            {
              control: getTextboxConfig('Email', 'officialEmail', undefined, InputType.email, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: {
                formControlName: 'aboutContent',
                label: 'Aboutus',
                placeholder: 'Enter a detailed description...',
                theme: 'default',
                toolbar: 'full',
                showWordCount: false,
                showCharCount: false,
                maxLength: 2500,
                minHeight: '500px'
              },
              type: DynamicFormControlType.TextEditor,
              class: 'col-12',
            },
          ]
        }
      ]
    }
  }
  protected override patchForm(data: IMetaInformation): void {
    this.formGroup.patchValue({
      metaInformationId: data.metaInformationId,
      phoneNo: data.phoneNo,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      country: data.country,
      pincode: data.pincode,
      officialEmail: data.officialEmail,
      aboutContent: data.aboutContent
    });
  }
  protected override submitForm(): void {
    const payload = {
      ...this.formGroup.value
    };

    this.store.create({
      endpoint: API.ADMIN.SITE_CONFIGURATION.META_INFORMATION.ADDUPDATE,
      body: payload as any,
    });
    this.ngOnInit();
  }
  protected override cancelRoute(): string[] {
    return ['admin/site-configuration/meta-information'];
  }

}