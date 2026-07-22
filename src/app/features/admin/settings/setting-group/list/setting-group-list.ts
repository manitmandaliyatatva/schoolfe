import { Component, inject } from '@angular/core';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { SettingGroup, settingGroupStore } from '../model/setting-group.model';
import { CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../shared/constants/api-url';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-setting-group-list',
  imports: [CommonDataGridComponent,CommonModule],
  templateUrl: './setting-group-list.html',
  styleUrl: './setting-group-list.scss',
})
export class SettingGroupList extends GridBase<SettingGroup> {

  protected override store: any = inject(settingGroupStore);
  protected override apiEndpoint: string = API.ADMIN.SETTINGS.SETTING_GROUP.LIST;
  protected override deleteEndpoint: string = API.ADMIN.SETTINGS.SETTING_GROUP.DELETE;
  protected override primaryKey: keyof SettingGroup = 'settingGroupId';
  protected override pageTitle: string = 'Setting Group';
  protected override routeBasePath: string = 'admin/setting/setting-group';
  protected override deleteConfirmTitle: string = 'Delete Group';
  protected override deleteConfirmMessage =  (row: SettingGroup) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.groupName);
  protected override buildColumns(): CommonDataGridColumnConfig<SettingGroup>[] {
    return [
      {
        field: 'settingGroupId',
        title: '',
        isHidden: true
      },
      {
        field: 'groupCode',
        title: 'Group Code',
        isSortable : true
      },
      {
        field: 'groupName',
        title: 'Group Name',
        isSortable : true
      },
      {
        field: 'isPublicSetting',
        title: 'Is Public Setting',
        isSortable : true
      }
    ]
  }
  protected override isAddButton = () => false;

}
