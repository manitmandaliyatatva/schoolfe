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
import { Classroom, CLASSROOM_CONST, classroomStore } from '../models/classroom.model';

@Component({
  selector: 'app-classroom',
  imports: [CommonModule, CommonDataGridComponent],
  providers: [classroomStore],
  templateUrl: './classroom.html',
})
export class ClassroomComponent extends GridBase<Classroom>{
  protected override store = inject(classroomStore);
  protected override apiEndpoint = API.ADMIN.CONFIGURATION.CLASSROOM.LIST;
  protected override deleteEndpoint = API.ADMIN.CONFIGURATION.CLASSROOM.DELETE;
  protected override primaryKey: keyof Classroom = 'classSectionId';
  protected override pageTitle = `${TITLES.ADMIN.CLASSROOM}`;
  protected override routeBasePath = 'admin/configuration/classrooms';
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: Classroom) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.sectionName);

  protected override buildColumns = (): CommonDataGridColumnConfig<Classroom>[] => {
    return [
      {
        title: CLASSROOM_CONST.CLASSROOM_ID,
        field: 'classSectionId',
        isHidden: true,
      },
      {
        title: SYSTEM_CONST.LABELS.ACADEMIC.CLASS,
        field: 'className',
        isSortable: true,
      },
      {
        title: CLASSROOM_CONST.SECTION_NAME,
        field: 'sectionName',
        isSortable: true,
      },
      {
        title: CLASSROOM_CONST.ROOM_NO,
        field: 'roomNo',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Number,
      },
      {
        title: CLASSROOM_CONST.ROOM_CAPACITY,
        field: 'roomCapacity',
        isSortable: true,
        fieldDataType: CommonDataGridFieldDataType.Number,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true,
      },
    ];
  };

}

