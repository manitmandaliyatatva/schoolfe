import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectionStrategy, ViewChild, TemplateRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDetailViewComponent } from '../../../../../shared/components/common-detail-view/common-detail-view';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import {
  CommonDataGridActionButtonConfig,
  CommonDataGridColumnConfig,
} from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { BRANCH_CONST, Branch, branchStore } from '../models/branch.model';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { DetailViewField } from '../../../../../shared/components/common-detail-view/model/common-detail-view.model';

@Component({
  selector: 'app-branch-list',
  imports: [CommonModule, CommonDataGridComponent, CommonDetailViewComponent, MatButtonModule],
  providers: [branchStore],
  templateUrl: './branch-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchListComponent extends GridBase<Branch> implements OnInit {
  private readonly genericDialogService = inject(GenericDialogService);

  @ViewChild('branchDetailTemplate') branchDetailTemplate!: TemplateRef<any>;

  protected readonly branchDetailFields: DetailViewField[] = [
    { label: BRANCH_CONST.BRANCH_NAME, key: 'branchName', span: 3 },
    { label: BRANCH_CONST.BRANCH_CODE, key: 'branchCode', span: 3 },
    { label: BRANCH_CONST.LANDMARK, key: 'landMark', span: 3 },
    { label: BRANCH_CONST.PHONE, key: 'phone', span: 3 },
    { label: BRANCH_CONST.EMAIL, key: 'email', span: 3 },
    { label: BRANCH_CONST.CITY, key: 'city', span: 3 },
    { label: BRANCH_CONST.STATE, key: 'state', span: 3 },
    { label: BRANCH_CONST.COUNTRY, key: 'country', span: 3 },
    { label: BRANCH_CONST.ADDRESS, key: 'address', span: 6 },
    { label: SYSTEM_CONST.LABELS.COMMON.STATUS, key: 'isActive', span: 6, type: 'status-chip' },
  ];

  protected override store = inject(branchStore);
  protected override apiEndpoint = API.SUPER_ADMIN.BRANCH.LIST;
  protected override deleteEndpoint = API.SUPER_ADMIN.BRANCH.DELETE;
  protected override primaryKey: keyof Branch = 'branchId';
  protected override pageTitle = `${TITLES.SUPER_ADMIN.BRANCH}`;
  protected override routeBasePath = 'admin/configuration/branches';
  protected override skipViewPermissionForEdit = true;
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: Branch) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.branchName);

  protected override buildColumns = (): CommonDataGridColumnConfig<Branch>[] => {
    return [
      {
        title: BRANCH_CONST.BRANCH_ID,
        field: 'branchId',
        isHidden: true,
      },
      {
        title: BRANCH_CONST.BRANCH_NAME,
        field: 'branchName',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.String,
      },
      {
        title: BRANCH_CONST.BRANCH_CODE,
        field: 'branchCode',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.String,
      },
      {
        title: BRANCH_CONST.CITY,
        field: 'city',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.String,
      },
      {
        title: BRANCH_CONST.PHONE,
        field: 'phone',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.String,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Boolean,
      },
    ];
  };

  protected override get extraActionButtons(): CommonDataGridActionButtonConfig<Branch>[] {
    return [
      {
        matIconName: 'visibility',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
        callback: (row) => this.onViewClick(row),
        visibleCallback: () => this.permission().canView,
      },
    ];
  }

  private onViewClick = (row: Branch): void => {
    this.store.getWithResult({
      endpoint: API.SUPER_ADMIN.BRANCH.GET,
      params: { branchId: row.branchId },
    }).subscribe((detailedBranch) => {
      if (detailedBranch) {
        this.genericDialogService.open({
          title: BRANCH_CONST.BRANCH_DETAILS,
          template: this.branchDetailTemplate,
          data: detailedBranch,
          maxWidth: '650px',
        });
      }
    });
  }
}
