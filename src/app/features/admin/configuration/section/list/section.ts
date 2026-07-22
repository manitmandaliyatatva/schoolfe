import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { SYSTEM_CONST } from "../../../../../core/constants/system.constant";
import { CommonDataGridComponent } from "../../../../../shared/components/common-data-grid/common-data-grid.component";
import { CommonDataGridFieldDataType } from "../../../../../shared/components/common-data-grid/enums/grid.enum";
import { CommonDataGridColumnConfig } from "../../../../../shared/components/common-data-grid/model/common-data-grid.model";
import { GridBase } from "../../../../../shared/components/grid-base/grid-base";
import { API } from "../../../../../shared/constants/api-url";
import { TITLES } from "../../../../../shared/constants/title.constant";
import { SECTION_CONST, SectionGridRow } from "../models/section.model";
import { SectionStore } from "../stores/section.store";

@Component({
  selector: 'app-section',
  imports: [CommonDataGridComponent],
  templateUrl: './section.html',
  styleUrl: './section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Section extends GridBase<SectionGridRow> {
  protected override store = inject(SectionStore);
  protected override apiEndpoint = API.CLASS.GET_SECTION_LIST;
  protected override deleteEndpoint = API.CLASS.DELETE_SECTION;
  protected override primaryKey: keyof SectionGridRow = 'sectionID';
  protected override pageTitle = `${TITLES.SECTION}`;
  protected override routeBasePath = 'admin/configuration/sections';
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: SectionGridRow) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.sectionName);

  protected override buildColumns(): CommonDataGridColumnConfig<SectionGridRow>[] {
    return [
      {
        title: SYSTEM_CONST.LABELS.COMMON.NAME,
        field: 'sectionName',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.String,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.CODE,
        field: 'sectionCode',
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

