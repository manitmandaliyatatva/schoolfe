import { Component, inject, Signal, TemplateRef, viewChild, ViewChild } from '@angular/core';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { ATTENDENCE_STATUS, attendenceStatusStore, IAttendenceStatus, IAttendanceStatusListRequest } from '../models/attendence-status';
import { CommonDataGridActionButtonConfig, CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { buildGridListRequest } from '../../../../../shared/helpers/grid.helper';

@Component({
  selector: 'app-attendence-status-list',
  imports: [CommonDataGridComponent],
  templateUrl: './attendence-status-list.html',
})
export class AttendenceStatusList extends GridBase<IAttendenceStatus> {
  protected override store = inject(attendenceStatusStore);
  protected override apiEndpoint: string = API.ADMIN.CONFIGURATION.ATTENDENCE_STATUS.LIST;
  protected override deleteEndpoint: string = API.ADMIN.CONFIGURATION.ATTENDENCE_STATUS.DELETE;
  protected override primaryKey: keyof IAttendenceStatus = 'attendanceStatusId';
  protected override pageTitle: string = TITLES.ADMIN.ATTENDENCE_STATUS;
  protected override routeBasePath: string = 'admin/configuration/attendance-statuses';
  protected override deleteConfirmTitle: string = SYSTEM_CONST.ACTION.DELETE;
  protected override deleteConfirmMessage = (row: IAttendenceStatus) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.attendanceStatusName);
  protected override isAddButtonDisabled = () => true;

  protected override signalStore = (): any => {
    return {
      ...this.store,
      load: (filter: any) => {
        this.onGridStateChange(filter);
        const body: IAttendanceStatusListRequest = {
          ...buildGridListRequest(filter),
          isFromAttendanceStatus: true
        };
        return this.store.getAll({
          endpoint: this.apiEndpoint,
          body: body as any,
        });
      },
    };
  };

  public override reloadList = (): void => {
    const state = this.currentGridState();
    this.store.getAll({
      endpoint: this.apiEndpoint,
      body: {
        ...buildGridListRequest<IAttendenceStatus>({
          pageIndex: state.pageIndex,
          pageSize: state.pageSize,
          defaultSortingColumn: state.sortColumn,
          sortOrder: state.sortOrder,
          generalSearch: state.generalSearch,
          filterData: state.extraFilters,
        }),
        isFromAttendanceStatus: true
      } as any,
    });
  };
  
  statusDisplayTemplate: Signal<TemplateRef<any>> = viewChild('statusDisplayTemplate');

  protected override buildColumns(): CommonDataGridColumnConfig<IAttendenceStatus>[] {
    return [
      {
        field: 'attendanceStatusId',
        isHidden: true,
        title: ''
      },
      {
        field: 'attendanceStatusName',
        isSortable: true,
        title: ATTENDENCE_STATUS.NAME
      },
      {
        field: 'attendanceStatusCode',
        isSortable: true,
        title: ATTENDENCE_STATUS.CODE
      },
      {
        field: 'colorCode',
        isSortable: false,
        title: ATTENDENCE_STATUS.STATUSDISPLAY,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.statusDisplayTemplate(),
      },
      {
        field: 'isActive',
        isSortable: true,
        title: SYSTEM_CONST.LABELS.COMMON.STATUS
      }
    ]
  }

}
