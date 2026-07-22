import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGrid, CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { SUBJECT_CONST, SubjectGridRow } from '../../../../admin/configuration/subject/models/subject.model';
import { SubjectStore } from '../../../../admin/configuration/subject/stores/subject.store';

@Component({
  selector: 'common-subject-list',
  standalone: true,
  imports: [CommonDataGridComponent],
  templateUrl: './subject-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubjectList extends GridBase<SubjectGridRow> {
  protected readonly authStore = inject(AuthStore);

  protected override store = inject(SubjectStore);
  protected override apiEndpoint = API.CLASS.GET_SUBJECT_LIST;
  protected override deleteEndpoint = API.CLASS.DELETE_SUBJECT;
  protected override primaryKey: keyof SubjectGridRow = 'subjectId';
  protected override pageTitle = `${TITLES.SUBJECT}`;
  protected override get routeBasePath(): string {
    return `${this.authStore.roleRoutePath()}/configuration/subjects`;
  }
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: SubjectGridRow) =>
    SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.subjectName);

  protected override buildColumns(): CommonDataGridColumnConfig<SubjectGridRow>[] {
    return [
      {
        title: SYSTEM_CONST.LABELS.COMMON.NAME,
        field: 'subjectName',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.String,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.CODE,
        field: 'subjectCode',
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
