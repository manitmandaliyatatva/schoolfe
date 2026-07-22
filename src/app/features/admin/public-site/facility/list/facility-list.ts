import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { facilityStore, IFacility } from '../models/facility.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../shared/constants/api-url';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonModule } from '@angular/common';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { SafeImageComponent } from '../../../../../shared/components/safe-image/safe-image.component';

@Component({
  selector: 'app-facility-list',
  imports: [CommonModule, CommonDataGridComponent, SafeImageComponent],
  templateUrl: './facility-list.html',
  styleUrl: './facility-list.scss',
})
export class FacilityList extends GridBase<IFacility> {
  @ViewChild('banner', { static: true }) banner!: TemplateRef<unknown>;

  protected override store = inject(facilityStore);
  protected override apiEndpoint: string = API.ADMIN.SITE_CONFIGURATION.FACILITY.LIST;
  protected override deleteEndpoint: string = API.ADMIN.SITE_CONFIGURATION.FACILITY.DELETE;
  protected override primaryKey: keyof IFacility = 'id';
  protected override pageTitle: string = 'Facility';
  protected override routeBasePath: string = 'admin/site-configuration/facility';
  protected override deleteConfirmTitle: string = "Delete Facility";
  protected override deleteConfirmMessage = (row: IFacility) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.title);
  protected override buildColumns(): CommonDataGridColumnConfig<IFacility>[] {
    return [
      {
        field: 'id',
        title: '',
        isHidden: true
      },
      {
        field: 'icon',
        title: 'Icon',
        customRenderCell: this.banner,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate
      },
      {
        field: 'title',
        title: 'Title',
        isSortable: true
      },
      {
        field: 'description',
        title: 'Description',
        isSortable: true
      }
    ]
  };
}
