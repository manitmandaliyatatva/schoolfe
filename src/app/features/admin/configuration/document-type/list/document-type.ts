import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, Signal, TemplateRef, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import {
  CommonDataGridActionButtonConfig,
  CommonDataGridColumnConfig,
} from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { DOCUMENT_TYPE_CONST, DocumentType, documentTypeStore } from '../models/document-type.model';

@Component({
  selector: 'app-document-type',
  imports: [CommonModule, CommonDataGridComponent, MatButtonModule],
  providers: [documentTypeStore],
  templateUrl: './document-type.html',
})
export class DocumentTypeComponent extends GridBase<DocumentType> implements OnInit {
  protected override store = inject(documentTypeStore);
  protected override apiEndpoint = API.ADMIN.CONFIGURATION.DOCUMENT_TYPE.LIST;
  protected override deleteEndpoint = API.ADMIN.CONFIGURATION.DOCUMENT_TYPE.DELETE;
  protected override primaryKey: keyof DocumentType = 'documentTypeId';
  protected override pageTitle = `${TITLES.CONFIGURATION.DOCUMENT_TYPE}`;
  protected override routeBasePath = 'admin/configuration/document-types';
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: DocumentType) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.documentTypeName);

  protected override buildColumns = (): CommonDataGridColumnConfig<DocumentType>[] => {
    return [
      {
        title: DOCUMENT_TYPE_CONST.DOCUMENT_TYPE_ID,
        field: 'documentTypeId',
        isHidden: true,
      },
      {
        title: SYSTEM_CONST.LABELS.DOCUMENTS.TYPE,
        field: 'documentTypeName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.USER.USER_TYPE,
        field: 'userTypeName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true
      },
    ];
  };

  override get actionButtons(): CommonDataGridActionButtonConfig<DocumentType>[] {
    return [];
  };

}


