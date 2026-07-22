import { CommonModule } from '@angular/common';
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { EXAM_TYPE_CONST, ExamType, examTypeStore } from '../models/examtype.model';

@Component({
  selector: 'app-examtype',
  imports: [CommonModule, CommonDataGridComponent],
  providers: [examTypeStore],
  templateUrl: './examtype.html',
})
export class ExamTypeComponent extends GridBase<ExamType> {
  protected override store = inject(examTypeStore);
  private readonly authStore = inject(AuthStore);
  protected override apiEndpoint = API.ADMIN.EXAMINATION.EXAM_TYPE.LIST;
  protected override deleteEndpoint = API.ADMIN.EXAMINATION.EXAM_TYPE.DELETE;
  protected override primaryKey: keyof ExamType = 'examTypeId';
  protected override pageTitle = `${TITLES.ADMIN.EXAM_TYPE}`;
  protected override get routeBasePath(): string {
    return `${this.authStore.roleRoutePath()}/examination/exam-types`;
  }
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: ExamType) =>
    SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.examTypeName);

  protected override buildColumns = (): CommonDataGridColumnConfig<ExamType>[] => {
    return [
      {
        title: EXAM_TYPE_CONST.EXAM_TYPE_ID,
        field: 'examTypeId',
        isHidden: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.NAME,
        field: 'examTypeName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.CODE,
        field: 'examTypeCode',
        isSortable: true,
      },
      {
        title: EXAM_TYPE_CONST.ALLOW_ADMIN,
        field: 'allowAdmin',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.BooleanIcon,
      },
      {
        title: EXAM_TYPE_CONST.ALLOW_TEACHER,
        field: 'allowTeacher',
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
