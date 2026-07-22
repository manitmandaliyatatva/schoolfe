import { Component, inject } from '@angular/core';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { feeTypeStore, IFeeType } from '../model/fee-type.model';

@Component({
  selector: 'app-fee-type-list',
  imports: [CommonDataGridComponent],
  templateUrl: './fee-type-list.html'
})
export class FeeTypeList extends GridBase<IFeeType> {

  protected override store: any = inject(feeTypeStore);
  protected override apiEndpoint: string = API.ADMIN.FEE.FEE_TYPE.LIST;
  protected override deleteEndpoint: string = API.ADMIN.FEE.FEE_TYPE.DELETE;
  protected override primaryKey: keyof IFeeType = 'feeTypeId';
  protected override pageTitle: string = TITLES.FEE.FEE_TYPE;
  protected override routeBasePath: string = 'admin/fee/fee-types';
  protected override deleteConfirmTitle: string = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: IFeeType) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.name);

  protected override buildColumns(): CommonDataGridColumnConfig<IFeeType>[] {
    return [
      {
        field : 'feeTypeId',
        isHidden : true,
        title : "Fee Id"
      },
      {
        field : 'name',
        title : SYSTEM_CONST.LABELS.COMMON.NAME,
        isSortable : true
      },
      {
        field : 'code',
        title : SYSTEM_CONST.LABELS.COMMON.CODE,
        isSortable : true
      },
      {
        field : 'frequencyName',
        title : SYSTEM_CONST.LABELS.COMMON.FREQUENCY,
        isSortable : true
      },
      {
        field : 'isActive',
        title : SYSTEM_CONST.LABELS.COMMON.STATUS,
        isSortable : true
      }
    ]
  }

}
