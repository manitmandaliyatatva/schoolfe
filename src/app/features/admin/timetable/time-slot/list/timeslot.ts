import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { Timeslot, TIMESLOT_CONST, timeslotStore } from '../../../../common/timetable/time-slot/models/timeslot.model';

@Component({
  selector: 'app-timeslot',
  imports: [CommonModule, CommonDataGridComponent],
  providers: [timeslotStore],
  templateUrl: './timeslot.html',
})
export class TimeslotComponent extends GridBase<Timeslot> {
  protected override store = inject(timeslotStore);
  protected override apiEndpoint = API.ADMIN.CONFIGURATION.TIMESLOT.LIST;
  protected override deleteEndpoint = API.ADMIN.CONFIGURATION.TIMESLOT.DELETE;
  protected override primaryKey: keyof Timeslot = 'timeSlotId';
  protected override pageTitle = `${TITLES.ADMIN.TIME_SLOT}`;
  protected override routeBasePath = 'admin/timetable/time-slots';
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: Timeslot) =>
    SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.slotName || row.name);

  protected override buildColumns = (): CommonDataGridColumnConfig<Timeslot>[] => {
    return [
      {
        title: TIMESLOT_CONST.TIMESLOT_ID,
        field: 'timeSlotId',
        isHidden: true,
      },
      {
        title: TIMESLOT_CONST.SLOT_NAME,
        field: 'slotName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.NAME,
        field: 'name',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.START_TIME,
        field: 'startTime',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Time,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.END_TIME,
        field: 'endTime',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Time,
      },
      {
        title: TIMESLOT_CONST.BREAK,
        field: 'isBreak',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.BooleanIcon,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true,
      },
    ];
  };
}
