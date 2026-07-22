import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { BaseFormComponent } from '../../../../../shared/components/form-base/form-base';
import { NewsAnnouncement, newsStore } from '../models/news-anouncement.model';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { API } from '../../../../../shared/constants/api-url';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getDatePickerConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import CommonHelper from '../../../../../core/helpers/common-helper';

@Component({
  selector: 'app-news-announcement-form',
  imports: [ReactiveFormsModule, DynamicFormComponent, ButtonComponent],
  templateUrl: './news-announcement-form.html'
})
export class NewsAnnouncementForm extends BaseFormComponent<NewsAnnouncement> {
  private readonly fb = inject(FormBuilder);

  protected override formGroup: FormGroup<any> = this.fb.group({
    newsId: [EMPTY_GUID],
    category: ['', [Validators.required]],
    metaDescription: ['', [Validators.required]],
    description: ['', [Validators.required]],
    newsDate: [null, [Validators.required]],
    imageUrl: ['', [Validators.required]],
    title : ['',[Validators.required]]
  });

  protected override formControls: DynamicForm;
  protected override store = inject(newsStore);
  protected override getByIdEndpoint: string = API.ADMIN.SITE_CONFIGURATION.NEWS_ANNOUNCEMENT.GETBYID;
  protected override entityIdParamKey: keyof NewsAnnouncement = 'newsId';

  protected override buildFormControls(): void {
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
                allowedExtensions: ['.jpeg', '.jpg', '.png']
              },
              type: DynamicFormControlType.ImageUpload,
              class: 'col-4',
            },
            {
              control: getTextboxConfig('Category', 'category', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-4',
            },
            {
              control: getTextboxConfig('Title', 'title', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-4',
            },
            {
              control: getDatePickerConfig(
                'newsDate',
                'News Date',
                null,
                null,
                () => CommonHelper.getDateByYear(100),
                () => CommonHelper.getDateByYear(0)
              ),
              type: DynamicFormControlType.Datepicker,
              class: 'col-4',
            },
            {
              control: {
                formControlName: 'metaDescription',
                label: 'Write Meta Description',
                placeholder: 'Enter a detailed description...',
                theme: 'minimal',
                toolbar: 'basic',
                showWordCount: false,
                showCharCount: false,
                maxLength: 250,
                minHeight: '500px'
              },
              type: DynamicFormControlType.TextEditor,
              class: 'col-6',
            },
            {
              control: {
                formControlName: 'description',
                label: 'Write News Here',
                placeholder: 'Enter a detailed description...',
                theme: 'minimal',
                toolbar: 'full',
                showWordCount: false,
                showCharCount: false,
                maxLength: 2500,
                minHeight: '500px'
              },
              type: DynamicFormControlType.TextEditor,
              class: 'col-6',
            },
          ]
        }
      ]
    }
  }
  protected override patchForm(data: NewsAnnouncement): void {
    this.formGroup.patchValue({
      newsId: data.newsId,
      category: data.category,
      metaDescription: data.metaDescription,
      description: data.description,
      imageUrl: data.imageUrl,
      newsDate: data.newsDate,
      title : data.title
    });
  }
  protected override submitForm(): void {
    const payload = {
      ...this.formGroup.value
    };

    this.store.create({
      endpoint: API.ADMIN.SITE_CONFIGURATION.NEWS_ANNOUNCEMENT.ADDUPDATE,
      body: payload as any,
    });
  }
  protected override cancelRoute(): string[] {
    return ['admin/site-configuration/news-announcement'];
  }

}
