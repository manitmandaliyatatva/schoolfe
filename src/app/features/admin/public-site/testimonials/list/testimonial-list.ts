import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { ITestimonials, testimonialStore } from '../model/testimonial.model';
import { CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../shared/constants/api-url';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { StarRatingConfig } from '../../../../../shared/components/star-rating/models/star-rating.model';
import { StarRating } from '../../../../../shared/components/star-rating/star-rating';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { SafeImageComponent } from '../../../../../shared/components/safe-image/safe-image.component';

@Component({
  selector: 'app-testimonial-list',
  imports: [CommonDataGridComponent, StarRating, ReactiveFormsModule, SafeImageComponent],
  templateUrl: './testimonial-list.html',
  styleUrl: './testimonial-list.scss',
})
export class TestimonialList extends GridBase<ITestimonials> {
  @ViewChild('reviewMessage', { static: true }) reviewMessage!: TemplateRef<any>;
  @ViewChild('rating', { static: true }) rating!: TemplateRef<any>;
  @ViewChild('banner', { static: true }) banner!: TemplateRef<unknown>;

  protected override store = inject(testimonialStore);
  protected override apiEndpoint: string = API.ADMIN.SITE_CONFIGURATION.TESTIMONIAL.LIST;
  protected override deleteEndpoint: string = API.ADMIN.SITE_CONFIGURATION.TESTIMONIAL.DELETE;
  protected override primaryKey: keyof ITestimonials = 'testimonialId';
  protected override pageTitle: string = "Testimonials";
  protected override routeBasePath: string = 'admin/site-configuration/testimonials';
  protected override deleteConfirmTitle: string = "Delete Confirm";
  protected override deleteConfirmMessage = (row: ITestimonials) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.reviewMessage);

  protected override buildColumns(): CommonDataGridColumnConfig<ITestimonials>[] {
    return [
      {
        field: 'testimonialId',
        title: '',
        isHidden: true
      },
      {
        field: 'profileImageUrl',
        title: 'Profile',
        customRenderCell: this.banner,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate
      },
      {
        field: 'reviewMessage',
        title: 'Review',
        customRenderCell: this.reviewMessage,
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
      },
      {
        field: 'rating',
        title: 'Rating',
        customRenderCell: this.rating,
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate
      },
      {
        field: 'designation',
        title: 'Designation',
        isSortable: true,
      },
      {
        field: 'personName',
        title: 'Person Name',
        isSortable: true,
      }
    ]
  }
  public starConfig = (value: number): StarRatingConfig => {
    return {
      initialValue: value,
      readonly: true,
      allowHalf: true,
      size: 16,
      gap: 2,
      filledColor: '#EF9F27',
    };
  }
  private readonly fb = inject(FormBuilder);

  protected formGroup: FormGroup<any> = this.fb.group({
    rating: [5, [Validators.required]],
  });;
}
