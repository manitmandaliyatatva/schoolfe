import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import {
  CommonDataGridColumnConfig,
} from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { SubjectStore } from '../../subject/stores/subject.store';
import { CLASS_SUBJECT_CONST, ClassSubject, classSubjectStore } from '../models/class-subject.model';

@Component({
  selector: 'app-class-subject',
  imports: [CommonModule, CommonDataGridComponent],
  providers: [classSubjectStore],
  templateUrl: './class-subject.html',
})
export class ClassSubjectComponent extends GridBase<ClassSubject> {

  protected override store = inject(classSubjectStore);
  protected override apiEndpoint = API.ADMIN.CONFIGURATION.CLASS_SUBJECT.LIST;
  protected override deleteEndpoint = API.ADMIN.CONFIGURATION.CLASS_SUBJECT.DELETE;
  protected override primaryKey: keyof ClassSubject = 'classSubjectId';
  protected override pageTitle = `${TITLES.ADMIN.CLASS_SUBJECT}`;
  protected override routeBasePath = 'admin/configuration/class-subjects';
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: ClassSubject) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.subjectName);

  protected override buildColumns = (): CommonDataGridColumnConfig<ClassSubject>[] => {
    return [
      {
        title: CLASS_SUBJECT_CONST.CLASS_SUBJECT_ID,
        field: 'classSubjectId',
        isHidden: true,
      },
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.CLASS,
        field: 'className',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT,
        field: 'subjectName',
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

