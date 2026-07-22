import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { EVENT_TYPE_CONST, EventType, eventTypeStore } from '../models/event-types.model';

@Component({
  selector: 'app-event-types',
  imports: [CommonModule, CommonDataGridComponent],
  providers: [eventTypeStore],
  templateUrl: './event-types.html',
})
export class EventTypesComponent extends GridBase<EventType> {

  @ViewChild('colorTemplate', { static: true }) colorTemplate!: TemplateRef<any>;

  protected override store = inject(eventTypeStore);
  protected override apiEndpoint = API.ADMIN.CALENDAR.EVENT_TYPES.LIST;
  protected override deleteEndpoint = API.ADMIN.CALENDAR.EVENT_TYPES.DELETE;
  protected override primaryKey: keyof EventType = 'eventTypeId';
  protected override pageTitle = `${EVENT_TYPE_CONST.EVENT_TYPE}`;
  protected override routeBasePath = 'admin/calendar/event-types';
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: EventType) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.eventTypeName);

  protected override buildColumns = (): CommonDataGridColumnConfig<EventType>[] => {
    return [
      {
        title: EVENT_TYPE_CONST.EVENT_TYPE_ID,
        field: 'eventTypeId',
        isHidden: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.NAME,
        field: 'eventTypeName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.COLOR_CODE,
        field: 'colorCode',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.colorTemplate,
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true,
      },
    ];
  };

}
