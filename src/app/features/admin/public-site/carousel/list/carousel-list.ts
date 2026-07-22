import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { carouselStore, ICarousel } from '../model/caousel.model';
import { CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../shared/constants/api-url';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { SafeImageComponent } from '../../../../../shared/components/safe-image/safe-image.component';

@Component({
  selector: 'app-carousel-list',
  imports: [CommonDataGridComponent,SafeImageComponent],
  templateUrl: './carousel-list.html',
  styleUrl: './carousel-list.scss',
})
export class CarouselList extends GridBase<ICarousel> {
  @ViewChild('banner', { static: true }) banner!: TemplateRef<unknown>;

  protected override store = inject(carouselStore);
  protected override apiEndpoint: string = API.ADMIN.SITE_CONFIGURATION.CAROUSEL.LIST;
  protected override deleteEndpoint: string = API.ADMIN.SITE_CONFIGURATION.CAROUSEL.DELETE;
  protected override primaryKey: keyof ICarousel = 'carouselId';
  protected override pageTitle: string = "Carousel";
  protected override routeBasePath: string = 'admin/site-configuration/carousel';
  protected override deleteConfirmTitle: string = SYSTEM_CONST.ACTION_BUTTONS.DELETE;;
  protected override deleteConfirmMessage = (row: ICarousel) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.title);

  protected override buildColumns(): CommonDataGridColumnConfig<ICarousel>[] {
    return [
      {
        field : 'imageUrl',
        title : 'Banner',
        customRenderCell : this.banner,
        fieldDataType : CommonDataGridFieldDataType.CustomRenderTemplate
      },
      {
        title: 'Title',
        field: 'title',
        isSortable: true,
      },
      {
        title: 'Button Text',
        field: 'buttonText',
        isSortable: true,
      },
      {
        title: 'Button Link',
        field: 'buttonLink',
        isSortable: true,
      },
      {
        title: 'Display Order',
        field: 'displayOrder',
        isSortable: true,
      },
    ]
  }

}
