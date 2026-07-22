import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import {
  CommonDataGridColumnConfig,
} from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { STUDENT_CATEGORY_CONST, StudentCategory, studentCategoryStore } from '../models/student-category.model';

@Component({
  selector: 'app-student-category',
  imports: [CommonModule, CommonDataGridComponent, MatButtonModule],
  providers: [studentCategoryStore],
  templateUrl: './student-category.html',
})
export class StudentCategoryComponent extends GridBase<StudentCategory> {

  protected override store = inject(studentCategoryStore);
  protected override apiEndpoint = API.ADMIN.CONFIGURATION.STUDENT_CATEGORY.LIST;
  protected override deleteEndpoint = API.ADMIN.CONFIGURATION.STUDENT_CATEGORY.DELETE;
  protected override primaryKey: keyof StudentCategory = 'categoryId';
  protected override pageTitle = `${TITLES.CONFIGURATION.STUDENT_CATEGORY}`;
  protected override routeBasePath = 'admin/configuration/student-categories';
  protected override deleteConfirmTitle = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: StudentCategory) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.categoryName);

  protected override buildColumns = (): CommonDataGridColumnConfig<StudentCategory>[] => {
    return [
      {
        title: STUDENT_CATEGORY_CONST.CATEGORY_ID,
        field: 'categoryId',
        isHidden: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.NAME,
        field: 'categoryName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.CODE,
        field: 'categoryCode',
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

