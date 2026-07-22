import { Component, inject, TemplateRef, viewChild } from '@angular/core';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import { BooleanStatusComponent } from '../../../../../../shared/components/boolean-status/boolean-status.component';
import { CommonDataGridComponent } from '../../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGridColumnConfig } from '../../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../../shared/constants/title.constant';
import { CurrencyFormatPipe } from '../../../../../../shared/pipes/currency-format.pipe';
import { PercentageFormatPipe } from '../../../../../../shared/pipes/percentage-format.pipe';
import { ILateFeeConfig, LateFeeConst, lateFeeStore } from '../../model/late-fee.model';

@Component({
  selector: 'app-late-fee-list',
  imports: [CommonDataGridComponent, BooleanStatusComponent, CurrencyFormatPipe, PercentageFormatPipe],
  templateUrl: './late-fee-list.html'
})
export class LateFeeList extends GridBase<ILateFeeConfig> {
  readonly booleanStatusTemplate = viewChild<TemplateRef<any>>('booleanStatus');
  readonly amountTemplate = viewChild<TemplateRef<any>>('amountTemplate');

  protected override store: any = inject(lateFeeStore);
  protected override apiEndpoint: string = API.ADMIN.FEE.LATE_FEE.LIST;
  protected override deleteEndpoint: string = API.ADMIN.FEE.LATE_FEE.DELETE;
  protected override primaryKey: keyof ILateFeeConfig = 'lateFeeConfigId';
  protected override pageTitle: string = TITLES.FEE.LATE_FEE;
  protected override routeBasePath: string = 'admin/fee/late-fees';
  protected override deleteConfirmTitle: string = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: ILateFeeConfig) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.feeTypeName || "Late Fee config");

  protected override buildColumns(): CommonDataGridColumnConfig<ILateFeeConfig>[] {
    return [
      {
        field: 'lateFeeConfigId',
        isHidden: true,
        title: LateFeeConst.ID
      },
      {
        field: 'feeTypeName',
        title: SYSTEM_CONST.LABELS.FEE.FEE_TYPE,
        isSortable: true
      },
      {
        field: 'daysFrom',
        title: LateFeeConst.DAYS_FROM,
        isSortable: true
      },
      {
        field: 'daysTo',
        title: LateFeeConst.DAYS_TO,
        isSortable: true
      },
      {
        field: 'lateFeeAmount',
        title: LateFeeConst.LATE_FEE_AMOUNT,
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.amountTemplate()
      },
      {
        field: 'isPercentage',
        title: LateFeeConst.IS_PERCENTAGE,
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.booleanStatusTemplate()
      },
      {
        field: 'isActive',
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        isSortable: true
      }
    ];
  }
}
