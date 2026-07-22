import { Component, inject } from '@angular/core';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { contactStore, IContactUsInquiryDto } from '../models/contactus.model';
import { CommonDataGridActionButtonConfig, CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../shared/constants/api-url';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../../../../core/store/auth.store';

@Component({
  selector: 'app-conatctus-list',
  imports: [CommonDataGridComponent,CommonModule],
  templateUrl: './conatctus-list.html',
  styleUrl: './conatctus-list.scss',
})
export class ConatctusList extends GridBase<IContactUsInquiryDto> {
  private authStore = inject(AuthStore);
  protected override store = inject(contactStore);
  protected override apiEndpoint: string = API.ADMIN.SITE_CONFIGURATION.CONTACTUS.LIST;
  protected override deleteEndpoint: string = API.ADMIN.SITE_CONFIGURATION.CONTACTUS.DELETE;
  protected override primaryKey: keyof IContactUsInquiryDto = 'contactUsInquiryId';
  protected override pageTitle: string = '';
  protected override routeBasePath: string = 'admin/site-configuration/conatctus';
  protected override deleteConfirmTitle: string;
  protected override deleteConfirmMessage: (row: IContactUsInquiryDto) => string;
  protected override buildColumns(): CommonDataGridColumnConfig<IContactUsInquiryDto>[] {
    return [
      {
        field: 'contactUsInquiryId',
        title: '',
        isHidden: true
      },
      {
        field: 'email',
        title: 'Email',
        isSortable: true
      },
      {
        field: 'fullName',
        title: 'Name',
        isSortable: true
      },
      {
        field: 'message',
        title: 'Message',
        isSortable: true
      }
    ]
  }
  protected override isAddButton = () => false;
  protected override get actionButtons(): CommonDataGridActionButtonConfig<IContactUsInquiryDto>[] {
    return [];
  }
}
