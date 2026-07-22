import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild, TemplateRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonDateFormat } from '../../../../../core/constants/date-format.constant';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import {
  CommonDataGridColumnConfig,
  CommonDataGridActionButtonConfig,
} from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { HOLIDAY_CONST, Holiday, holidayStore } from '../models/holiday.model';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { AuthStore } from '../../../../../core/store/auth.store';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { CommonDetailViewComponent } from '../../../../../shared/components/common-detail-view/common-detail-view';
import { DetailViewField } from '../../../../../shared/components/common-detail-view/model/common-detail-view.model';

@Component({
  selector: 'app-holiday',
  imports: [CommonModule, CommonDataGridComponent, CommonDetailViewComponent],
  providers: [holidayStore],
  templateUrl: './holiday.html',
})
export class HolidayComponent extends GridBase<Holiday> {
  private readonly genericDialogService = inject(GenericDialogService);
  private readonly authStore = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  protected override disableActionsInPastAcademicYear = true;

  @ViewChild('holidayDetailTemplate') holidayDetailTemplate!: TemplateRef<any>;

  protected readonly HOLIDAY_CONST = HOLIDAY_CONST;
  protected readonly SYSTEM_CONST = SYSTEM_CONST;
  protected readonly CommonDateFormat = CommonDateFormat;

  protected readonly holidayDetailFields: DetailViewField[] = [
    { label: HOLIDAY_CONST.HOLIDAY_NAME, key: 'name', span: 3 },
    { label: HOLIDAY_CONST.START_DATE, key: 'startDate', span: 3, type: 'date' },
    { label: HOLIDAY_CONST.END_DATE, key: 'endDate', span: 3, type: 'date' },
    { label: HOLIDAY_CONST.HOLIDAY_GROUP, key: 'holidayGroupName', span: 3 },
    { label: HOLIDAY_CONST.CREATED_BY, key: 'createdBy', span: 3 },
    { label: HOLIDAY_CONST.DESCRIPTION, key: 'description', span: 6 },
    { label: SYSTEM_CONST.LABELS.COMMON.STATUS, key: 'isActive', span: 6, type: 'status-chip' },
  ];

  protected override store = inject(holidayStore);
  protected override apiEndpoint =  API.ADMIN.CONFIGURATION.HOLIDAY.LIST;
  protected override deleteEndpoint =  API.ADMIN.CONFIGURATION.HOLIDAY.DELETE;
  protected override primaryKey: keyof Holiday = 'holidayId';
  protected override pageTitle = `${TITLES.ADMIN.HOLIDAY}`;
  protected override routeBasePath = 'admin/configuration/holidays';
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: Holiday) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.name);

  protected override get extraActionButtons(): CommonDataGridActionButtonConfig<Holiday>[] {
    return [
      {
        matIconName: 'visibility',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
        callback: (row) => this.onViewClick(row),
        visibleCallback: () => this.permission().canView,
      },
    ];
  }

  protected override get baseActionButtons(): CommonDataGridActionButtonConfig<Holiday>[] {
    return [
      {
        matIconName: 'edit',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
        callback: this.onEditClick,
        visibleCallback: (row?: Holiday) => {
          if (!this.permission().canUpdate) return false;
          if (!row) return true;
          return !CommonHelper.isPastDate(row.startDate) && !!row.isEditable && (this.allowEditOnPastYear || this.isActionAllowed);
        },
      },
      {
        matIconName: 'delete',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        callback: this.onDeleteClick,
        visibleCallback: (row?: Holiday) => {
          if (!this.permission().canDelete) return false;
          if (!row) return true;
          return !CommonHelper.isPastDate(row.startDate) && !!row.isEditable && this.isActionAllowed;
        },
      },
    ];
  }

  private onViewClick(row: Holiday): void {
    this.store.getWithResult({
      endpoint: API.ADMIN.CONFIGURATION.HOLIDAY.GET,
      params: { holidayId: row.holidayId },
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((detailedHoliday) => {
      if (detailedHoliday) {
        this.genericDialogService.open({
          title: this.HOLIDAY_CONST.HOLIDAY_DETAILS,
          template: this.holidayDetailTemplate,
          data: {
            ...row,
            ...detailedHoliday
          },
          width: '500px',
        });
      }
    });
  }

  protected override buildColumns = (): CommonDataGridColumnConfig<Holiday>[] => {
    return [
      {
        title: HOLIDAY_CONST.HOLIDAY_ID,
        field: 'holidayId',
        isHidden: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.NAME,
        field: 'name',
        isSortable: true,
      },
      {
        title: HOLIDAY_CONST.START_DATE,
        field: 'startDate',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date,
        displayFormat: CommonDateFormat.DDMMYYYY_WithSlash,
      },
      {
        title: HOLIDAY_CONST.END_DATE,
        field: 'endDate',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date,
        displayFormat: CommonDateFormat.DDMMYYYY_WithSlash,
      },
      {
        title: HOLIDAY_CONST.HOLIDAY_GROUP,
        field: 'holidayGroupName',
        isSortable: true,
      },
      {
        title: HOLIDAY_CONST.CREATED_BY,
        field: 'createdBy',
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
