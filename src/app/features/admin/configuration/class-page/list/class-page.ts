import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { CLASS_PAGE_CONST, ClassGridRow } from '../models/class.model';
import { ClassStore } from '../stores/class.store';

@Component({
  selector: 'app-class-page',
  imports: [CommonDataGridComponent, CommonModule],
  templateUrl: './class-page.html',
  styleUrl: './class-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassPage extends GridBase<ClassGridRow> {
  protected override store = inject(ClassStore);
  protected override apiEndpoint = API.CLASS.GET_CLASS_LIST;
  protected override deleteEndpoint = API.CLASS.DELETE_CLASS;
  protected override primaryKey: keyof ClassGridRow = 'classId';
  protected override pageTitle = `${TITLES.CLASS}`;
  protected override routeBasePath = 'admin/configuration/classes';
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: ClassGridRow) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.className);

  protected override buildColumns(): CommonDataGridColumnConfig<ClassGridRow>[] {
    return [
      {
        title: SYSTEM_CONST.LABELS.COMMON.NAME,
        field: 'className',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.String,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.CODE,
        field: 'classCode',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.String,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.CATEGORY,
        field: 'category',
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
  }
}

