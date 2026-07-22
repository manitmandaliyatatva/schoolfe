import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnDestroy, OnInit, untracked } from '@angular/core';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import {
  CommonDataGrid,
  CommonDataGridActionButtonConfig,
  CommonDataGridColumnConfig,
  CommonDataGridStore,
} from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { getDateRangeConfig, getDropdownConfig } from '../../../../../shared/functions/config-function';
import { buildGridListRequest } from '../../../../../shared/helpers/grid.helper';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { CalendarView } from '../../../../common/calendar/calendar/view/calendar-view';
import { EventDto, EVENTS_CONST, eventStore } from '../models/events.model';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';

@Component({
  selector: 'app-admin-events-list',
  standalone: true,
  imports: [CommonModule, CommonDataGridComponent],
  providers: [eventStore],
  templateUrl: './events-list.html',
})
export class EventsListComponent extends GridBase<EventDto> implements OnInit, OnDestroy {
  private readonly DROPDOWN_KEYS = {
    eventType: 'eventListEventType',
  } as const;

  protected override store = inject(eventStore);
  private readonly authStore = inject(AuthStore);
  private readonly genericDialog = inject(GenericDialogService);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly academicYearHelper = inject(AcademicYearHelperService);

  protected override apiEndpoint = API.ADMIN.CALENDAR.EVENTS.LIST;
  protected override deleteEndpoint = API.ADMIN.CALENDAR.EVENTS.DELETE;
  protected override primaryKey: keyof EventDto = 'eventId';
  protected override pageTitle = `${EVENTS_CONST.EVENTS}`;
  protected override routeBasePath = 'admin/calendar/events';
  protected override disableActionsInPastAcademicYear = true;
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: EventDto) =>
    SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.eventTitle);

  readonly eventTypeDropdownList = this.dropdownStore.getList(this.DROPDOWN_KEYS.eventType);

  constructor() {
    super();
    this.registerDropdownReactivity('eventTypeId', this.eventTypeDropdownList);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadDropdownData();
  }

  private updateFormControlOptions(formControlName: string, options: ITextValueOption[]): void {
    const filterForm = this.gridConfig?.features?.filter?.form;
    if (!filterForm) return;

    for (const section of filterForm.formSection) {
      const controlConfig = section.controls?.find(
        (c) => (c.control as any).formControlName === formControlName
      );
      if (controlConfig) {
        (controlConfig.control as any).data = options;
        controlConfig.control = { ...controlConfig.control };
      }
    }
    this.gridConfig = { ...this.gridConfig };
  }

  private loadDropdownData(): void {
    this.dropdownStore.getDropdown<any>({
      key: this.DROPDOWN_KEYS.eventType,
      endpoint: API.ADMIN.CALENDAR.EVENT_TYPES.DROPDOWN,
    });
  }

  protected override buildGridConfig(): CommonDataGrid<EventDto> {
    const config = super.buildGridConfig();
    config.features = {
      ...config.features,
      showSearch: true,
      filter: {
        form: {
          formSection: [
            {
              controls: [
                {
                  control: {
                    ...getDropdownConfig(
                      'eventTypeId',
                      EVENTS_CONST.EVENT_TYPE,
                      this.eventTypeDropdownList()
                    ),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: getDateRangeConfig(
                    SYSTEM_CONST.LABELS.COMMON.START_DATE,
                    'startDateFrom',
                    'startDateTo',
                    null,
                    null,
                    null,
                    null,
                    () => this.academicYearHelper.getAcademicYearStartDate(),
                    () => this.academicYearHelper.getDatepickerMaxDate()
                  ),
                  type: DynamicFormControlType.DateRangePicker,
                  class: 'col-12',
                },
                {
                  control: getDateRangeConfig(
                    SYSTEM_CONST.LABELS.COMMON.END_DATE,
                    'endDateFrom',
                    'endDateTo',
                    null,
                    null,
                    null,
                    null,
                    () => this.academicYearHelper.getAcademicYearStartDate(),
                    () => this.academicYearHelper.getDatepickerMaxDate()
                  ),
                  type: DynamicFormControlType.DateRangePicker,
                  class: 'col-12',
                },
              ],
            },
          ],
        },
      },
    };
    return config;
  }

  private registerDropdownReactivity(
    formControlName: string,
    source: () => ITextValueOption[]
  ): void {
    effect(() => {
      const options = source();
      untracked(() => this.updateFormControlOptions(formControlName, options));
    });
  }

  protected override buildColumns = (): CommonDataGridColumnConfig<EventDto>[] => {
    return [
      {
        title: EVENTS_CONST.EVENT_TITLE,
        field: 'eventId',
        isHidden: true,
      },
      {
        title: EVENTS_CONST.EVENT_TITLE,
        field: 'eventTitle',
        isSortable: true,
      },
      {
        title: EVENTS_CONST.EVENT_TYPE,
        field: 'eventTypeName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.START_DATE,
        field: 'startDate',
        fieldDataType: CommonDataGridFieldDataType.Date,
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.END_DATE,
        field: 'endDate',
        fieldDataType: CommonDataGridFieldDataType.Date,
        isSortable: true,
      },
      {
        title: EVENTS_CONST.LOCATION,
        field: 'location',
        isSortable: true,
      },
      {
        title: EVENTS_CONST.CREATED_BY,
        field: 'createdByName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true,
      },
    ];
  };

  private canModifyEvent = (row: EventDto | undefined, hasPermission: boolean): boolean => {
    if (!hasPermission) return false;
    if (!row) return true;
    return CommonHelper.isFutureEvent(row.startDate, row.isAllDay) && !!row.isEditable;
  };

  protected override get baseActionButtons(): CommonDataGridActionButtonConfig<EventDto>[] {
    return [
      {
        matIconName: 'visibility',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
        callback: (row) => this.onViewClick(row),
        visibleCallback: () => true,
      },
      {
        matIconName: 'edit',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
        callback: this.onEditClick,
        visibleCallback: (row) => this.canModifyEvent(row, this.permission().canUpdate),
      },
      {
        matIconName: 'delete',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        callback: this.onDeleteClick,
        visibleCallback: (row) => this.canModifyEvent(row, this.permission().canDelete),
      },
    ];
  }

  public onViewClick(row: EventDto): void {
    this.genericDialog.open({
      title: EVENTS_CONST.VIEW_EVENT,
      component: CalendarView,
      width: '800px',
      maxWidth: '90vw',
      data: { id: row.eventId, hideActions: true },
    });
  }

  protected override signalStore = (): CommonDataGridStore<EventDto> => {
    return {
      ...this.store,
      load: (filter: any) => {
        this.onGridStateChange(filter);
        return this.store.getAll({
          endpoint: this.apiEndpoint,
          body: this.getGridRequest(filter),
        });
      },
    };
  };

  public override reloadList = (): void => {
    const state = this.currentGridState();
    this.store.getAll({
      endpoint: this.apiEndpoint,
      body: this.getGridRequest({
        pageIndex: state.pageIndex,
        pageSize: state.pageSize,
        defaultSortingColumn: state.sortColumn,
        sortOrder: state.sortOrder,
        generalSearch: state.generalSearch,
      }),
    });
  };

  private getGridRequest(filter: any): any {
    const body = buildGridListRequest(filter);
    body.columns.push({
      name: 'myevents',
      filterSearch: {
        value: 'true',
      },
    });
    return body;
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.dropdownStore.resetState();
  }
}
