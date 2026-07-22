import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnDestroy, OnInit, untracked } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { AcademicYearHelperService } from '../../../../../core/services/academic-year-helper.service';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGrid, CommonDataGridActionButtonConfig, CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { NoticeDetailDialog } from '../../../../../shared/components/notice-detail-dialog/notice-detail-dialog';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { getDateRangeConfig, getDropdownConfig, getSlideToggleConfig } from '../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { INotice, NOTICE, noticeStore } from '../model/notice.model';

@Component({
  selector: 'common-notice-list',
  standalone: true,
  imports: [
    CommonModule, 
    CommonDataGridComponent, 
    MatDialogModule
  ],
  providers: [noticeStore],
  templateUrl: './notice-list.html'
})
export class CommonNoticeList extends GridBase<INotice> implements OnInit, OnDestroy {
  readonly authStore = inject(AuthStore);

  protected override store: any = inject(noticeStore);
  private readonly dialog = inject(MatDialog);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly academicYearHelper = inject(AcademicYearHelperService);

  protected override apiEndpoint: string = API.ADMIN.COMMUNICATION.NOTICE.LIST;
  protected override deleteEndpoint: string = API.ADMIN.COMMUNICATION.NOTICE.DELETE;
  protected override primaryKey: keyof INotice = 'noticeId';
  protected override pageTitle: string = `${TITLES.COMMUNICATION.NOTICE}`;
  protected override routeBasePath: string = `${this.authStore.roleRoutePath().toLocaleLowerCase()}/communication/my-notices`;
  protected override disableActionsInPastAcademicYear = true;
  protected override allowEditOnPastYear = false;
  protected override deleteConfirmTitle: string = NOTICE.DELETE_ROLE;
  protected override deleteConfirmMessage = (row: INotice) => NOTICE.CONFIRM_DELETE(row.noticeTypeName);
  protected override skipViewPermissionForEdit = true;

  readonly noticeTypeDropdownList = this.dropdownStore.getList('noticeType');

  constructor() {
    super();
    effect(() => {
      const options = this.noticeTypeDropdownList();
      untracked(() => this.updateFormControlOptions('noticeTypeId', options));
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.dropdownStore.getDropdown<any>({
      key: 'noticeType',
      endpoint: API.ADMIN.COMMUNICATION.NOTICE_TYPE.DROPDOWN,
    });
  }

  private updateFormControlOptions(formControlName: string, options: ITextValueOption[]): void {
    const filterForm = this.gridConfig?.features?.filter?.form;
    if (!filterForm) return;

    for (const section of filterForm.formSection) {
      const controlConfig = section.controls?.find(
        (c) => (c.control as any).formControlName === formControlName
      );
      if (controlConfig) {
        (controlConfig.control as any).data = options;
        controlConfig.control = { ...controlConfig.control };
      }
    }
    this.gridConfig = { ...this.gridConfig };
  }

  protected override buildGridConfig(): CommonDataGrid<INotice> {
    const config = super.buildGridConfig();
    config.features = {
      ...config.features,
      showSearch: true,
      filter: {
        form: {
          formSection: [
            {
              controls: [
                {
                  control: {
                    ...getDropdownConfig(
                      'noticeTypeId',
                      NOTICE.NOTICE_TYPE,
                      this.noticeTypeDropdownList()
                    ),
                    isFloatLabel: false,
                  },
                  type: DynamicFormControlType.DropDown,
                  class: 'col-12',
                },
                {
                  control: {
                    ...getDateRangeConfig(
                      NOTICE.PUBLISH_DATE,
                      'publishDateFrom',
                      'publishDateTo'
                    ),
                    min: () => this.academicYearHelper.getAcademicYearStartDate(),
                    max: () => this.academicYearHelper.getDatepickerMaxDate()
                  },
                  type: DynamicFormControlType.DateRangePicker,
                  class: 'col-12',
                },
                {
                  control: {
                    ...getDateRangeConfig(
                      NOTICE.EXPIRY_DATE,
                      'expiryDateFrom',
                      'expiryDateTo'
                    ),
                    min: () => this.academicYearHelper.getAcademicYearStartDate(),
                    max: () => this.academicYearHelper.getDatepickerMaxDate()
                  },
                  type: DynamicFormControlType.DateRangePicker,
                  class: 'col-12',
                },
                {
                  control: getSlideToggleConfig('isImportant', NOTICE.IMPORTANT),
                  type: DynamicFormControlType.SlideToggle,
                  class: 'col-12',
                },
              ],
            },
          ],
        },
      },
    };
    return config;
  }

  protected override get extraActionButtons(): CommonDataGridActionButtonConfig<INotice>[] {
    return [
      {
        matIconName: 'visibility',
        buttonText: SYSTEM_CONST.ACTION_BUTTONS.VIEW,
        callback: (row) => this.onView(row),
        visibleCallback: () => this.permission().canView,
      }
    ];
  }

  onView(notice: INotice): void {
    this.dialog.open(NoticeDetailDialog, {
      width: '520px',
      autoFocus: false,
      data: notice
    });
  }

  protected buildColumns = (): CommonDataGridColumnConfig<INotice>[] => {
    return [
      {
        title: NOTICE.NOTICE_TYPE_ID,
        field: 'noticeId',
        isHidden: true,
      },
      {
        title: NOTICE.TITLE,
        field: 'title',
        isSortable: true,
      },
      {
        title: NOTICE.NOTICE_TYPE,
        field: 'noticeTypeName',
        isSortable: true,
      },
      {
        title: NOTICE.NOTICE_GROUP,
        field: 'noticeGroupName',
        isSortable: true,
      },
      {
        title: NOTICE.PUBLISH_DATE,
        field: 'publishDate',
        fieldDataType: CommonDataGridFieldDataType.Date,
        isSortable: true,
      },
      {
        title: NOTICE.EXPIRY_DATE,
        field: 'expiryDate',
        fieldDataType: CommonDataGridFieldDataType.Date,
        isSortable: true,
      },
      {
        title : NOTICE.IMPORTANT,
        field : 'isImportant',
        fieldDataType : CommonDataGridFieldDataType.BooleanIcon,
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true,
        isHidden: this.authStore.isStudent(),
      },
    ];
  };

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
