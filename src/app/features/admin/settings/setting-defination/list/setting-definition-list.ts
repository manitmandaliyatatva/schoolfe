import { Component, inject } from '@angular/core';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { SettingDefinition, settingDefinitionStore } from '../model/setting-defination.model';
import { CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../shared/constants/api-url';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-setting-definition-list',
  imports: [CommonDataGridComponent,CommonModule],
  templateUrl: './setting-definition-list.html',
  styleUrl: './setting-definition-list.scss',
})
export class SettingDefinitionList extends GridBase<SettingDefinition> {

  protected override store = inject(settingDefinitionStore);
  protected override apiEndpoint: string = API.ADMIN.SETTINGS.SETTING_DEFINATION.LIST;
  protected override deleteEndpoint: string = API.ADMIN.SETTINGS.SETTING_DEFINATION.DELETE;
  protected override primaryKey: keyof SettingDefinition = 'settingDefinitionId';
  protected override pageTitle: string = 'Setting Definition';
  protected override routeBasePath: string = 'admin/setting/setting-definition';
  protected override deleteConfirmTitle: string = 'Delete Definition';
  protected override deleteConfirmMessage = (row: SettingDefinition) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.settingLabel);

  protected override buildColumns(): CommonDataGridColumnConfig<SettingDefinition>[] {
    return [
      {
        field : 'settingDefinitionId',
        title : '',
        isHidden : true
      },
      {
        field : 'settingGroupName',
        title : 'Setting Group',
        isSortable : true
      },
      {
        field : 'settingLabel',
        title : 'Setting Name',
        isSortable : true
      },
      {
        field : 'controlType',
        title : 'Control Type',
        isSortable : true
      },
      {
        field : 'displayOrder',
        title : 'Display Order',
        isSortable : true
      }
    ]
  }
}
