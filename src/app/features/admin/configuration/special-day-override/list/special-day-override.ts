import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild, TemplateRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { SPECIAL_DAY_OVERRIDE_CONST, SpecialDayOverride, specialDayOverrideStore } from '../models/special-day-override.model';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { CommonDetailViewComponent } from '../../../../../shared/components/common-detail-view/common-detail-view';
import { DetailViewField } from '../../../../../shared/components/common-detail-view/model/common-detail-view.model';
import { CommonDateFormat } from '../../../../../core/constants/date-format.constant';

@Component({
  selector: 'app-special-day-override',
  imports: [CommonModule, CommonDataGridComponent, CommonDetailViewComponent],
  providers: [specialDayOverrideStore],
  templateUrl: './special-day-override.html',
})
export class SpecialDayOverrideComponent extends GridBase<SpecialDayOverride> {
  private readonly genericDialogService = inject(GenericDialogService);
  private readonly destroyRef = inject(DestroyRef);

  protected override disableActionsInPastAcademicYear = true;

  @ViewChild('overrideDetailTemplate') overrideDetailTemplate!: TemplateRef<any>;

  protected readonly SPECIAL_DAY_OVERRIDE_CONST = SPECIAL_DAY_OVERRIDE_CONST;
  protected readonly SYSTEM_CONST = SYSTEM_CONST;

  protected get overrideDetailFields(): DetailViewField[] {
    return [
      { label: this.SPECIAL_DAY_OVERRIDE_CONST.OVERRIDE_DATE, key: 'overrideDate', span: 3, type: 'date' },
      { label: this.SPECIAL_DAY_OVERRIDE_CONST.DAY_TYPE, key: 'dayTypeName', span: 3 },
      { label: this.SPECIAL_DAY_OVERRIDE_CONST.TARGET_GROUP, key: 'specialDayOverrideGroupName', span: 3 },
      { label: this.SPECIAL_DAY_OVERRIDE_CONST.REASON, key: 'reason', span: 3 },
      { label: this.SPECIAL_DAY_OVERRIDE_CONST.CREATED_BY, key: 'createdBy', span: 3 },
      { label: this.SYSTEM_CONST.LABELS.COMMON.STATUS, key: 'isActive', span: 3, type: 'status-chip' },
    ];
  }

  protected override store = inject(specialDayOverrideStore);
  protected override apiEndpoint = API.ADMIN.CONFIGURATION.SPECIAL_DAY_OVERRIDE.LIST;
  protected override deleteEndpoint = API.ADMIN.CONFIGURATION.SPECIAL_DAY_OVERRIDE.DELETE;
  protected override primaryKey: keyof SpecialDayOverride = 'specialDayOverrideId';
  protected override pageTitle = `${TITLES.ADMIN.SPECIAL_DAY_OVERRIDE}`;
  protected override routeBasePath = 'admin/configuration/special-day-override';
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: SpecialDayOverride) => 
    SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.overrideDate ? CommonHelper.toFormattedDate(row.overrideDate, CommonDateFormat.DDMMYYYY_WithSlash) : '');

  protected override get extraActionButtons(): CommonDataGridActionButtonConfig<SpecialDayOverride>[] {
    return [
      {
        matIconName: 'visibility',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
        callback: (row) => this.onViewClick(row),
        visibleCallback: () => this.permission().canView,
      },
    ];
  }

  protected override get baseActionButtons(): CommonDataGridActionButtonConfig<SpecialDayOverride>[] {
    return [
      {
        matIconName: 'edit',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
        callback: this.onEditClick,
        visibleCallback: (row?: SpecialDayOverride) => this.permission().canUpdate && (!row || (!CommonHelper.isPastDate(row.overrideDate) && row.isEditable)) && (this.allowEditOnPastYear || this.isActionAllowed),
      },
      {
        matIconName: 'delete',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        callback: this.onDeleteClick,
        visibleCallback: (row?: SpecialDayOverride) => this.permission().canDelete && (!row || (!CommonHelper.isPastDate(row.overrideDate) && row.isEditable)) && this.isActionAllowed,
      },
    ];
  }

  private onViewClick(row: SpecialDayOverride): void {
    this.store.getWithResult({
      endpoint: API.ADMIN.CONFIGURATION.SPECIAL_DAY_OVERRIDE.GET,
      params: { specialDayOverrideId: row.specialDayOverrideId },
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((detailedOverride) => {
      if (detailedOverride) {
        this.genericDialogService.open({
          title: this.SPECIAL_DAY_OVERRIDE_CONST.SPECIAL_DAY_OVERRIDE_DETAILS,
          template: this.overrideDetailTemplate,
          data: detailedOverride,
          width: '550px',
          maxWidth: '650px',
        });
      }
    });
  }

  protected override buildColumns = (): CommonDataGridColumnConfig<SpecialDayOverride>[] => {
    return [
      {
        title: SPECIAL_DAY_OVERRIDE_CONST.SPECIAL_DAY_OVERRIDE_ID,
        field: 'specialDayOverrideId',
        isHidden: true,
      },
      {
        title: SPECIAL_DAY_OVERRIDE_CONST.OVERRIDE_DATE,
        field: 'overrideDate',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Date
      },
      {
        title: SPECIAL_DAY_OVERRIDE_CONST.DAY_TYPE,
        field: 'dayTypeName',
        isSortable: true,
      },
      {
        title: SPECIAL_DAY_OVERRIDE_CONST.TARGET_GROUP,
        field: 'specialDayOverrideGroupName',
        isSortable: true,
      },
      {
        title: SPECIAL_DAY_OVERRIDE_CONST.CREATED_BY,
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
