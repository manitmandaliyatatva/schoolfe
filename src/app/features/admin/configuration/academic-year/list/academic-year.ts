import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
import { ACADEMIC_YEAR_CONST, AcademicYear, academicYearStore } from '../models/academic-year.model';

@Component({
  selector: 'app-academic-year',
  imports: [CommonModule, CommonDataGridComponent],
  providers: [academicYearStore],
  templateUrl: './academic-year.html',
})
export class AcademicYearComponent extends GridBase<AcademicYear> {

  protected override store = inject(academicYearStore);
  protected override apiEndpoint =  API.ADMIN.CONFIGURATION.ACADEMIC_YEAR.LIST;
  protected override deleteEndpoint =  API.ADMIN.CONFIGURATION.ACADEMIC_YEAR.DELETE;
  protected override primaryKey: keyof AcademicYear = 'academicYearId';
  protected override pageTitle = `${TITLES.ADMIN.ACADEMIC_YEAR}`;
  protected override routeBasePath = 'admin/configuration/academic-years';
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: AcademicYear) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.academicYearName);

  protected override buildColumns = (): CommonDataGridColumnConfig<AcademicYear>[] => {
    return [
      {
        title: ACADEMIC_YEAR_CONST.ACADEMIC_YEAR_ID,
        field: 'academicYearId',
        isHidden: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.NAME,
        field: 'academicYearName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.CODE,
        field: 'academicYearCode',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.START_DATE,
        field: 'startDate',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date,
        displayFormat: CommonDateFormat.DDMMYYYY_WithSlash,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.END_DATE,
        field: 'endDate',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date,
        displayFormat: CommonDateFormat.DDMMYYYY_WithSlash,
      },
      {
        title: ACADEMIC_YEAR_CONST.IS_CURRENT_ACADEMIC_YEAR,
        field: 'isCurrentAcademicYear',
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

  protected override get baseActionButtons(): CommonDataGridActionButtonConfig<AcademicYear>[] {
    return [
      {
        matIconName: 'edit',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
        callback: this.onEditClick,
        visibleCallback: () => this.permission().canUpdate || this.permission().canView,
      },
      {
        matIconName: 'delete',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        callback: this.onDeleteClick,
        visibleCallback: (row: AcademicYear) => this.permission().canDelete && !row.isCurrentAcademicYear,
      },
    ];
  }

  protected override get extraActionButtons(): CommonDataGridActionButtonConfig<AcademicYear>[] {
    return [
      {
        buttonText: ACADEMIC_YEAR_CONST.SET_AS_CURRENT,
        matIconName: 'event_available',
        callback: this.onSetCurrentClick,
        visibleCallback: (row: AcademicYear) => this.permission().canUpdate && !row.isCurrentAcademicYear
      },
    ]
  }

  private onSetCurrentClick = (row: AcademicYear): void => {
    this.confirmService
      .confirm({
        title: ACADEMIC_YEAR_CONST.SET_AS_CURRENT,
        message: ACADEMIC_YEAR_CONST.CONFIRM_SET_AS_CURRENT(row.academicYearName),
        confirmText: ACADEMIC_YEAR_CONST.SET_AS_CURRENT,
        cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.store.getWithResult({
          endpoint: API.ADMIN.CONFIGURATION.ACADEMIC_YEAR.SET_CURRENT,
          params: { academicYearId: row.academicYearId }
        }).subscribe(() => this.reloadList());
      });
  }

}

