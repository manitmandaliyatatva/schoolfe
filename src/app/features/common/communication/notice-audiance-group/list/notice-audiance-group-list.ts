import { Component, inject } from "@angular/core";
import { SYSTEM_CONST } from "../../../../../core/constants/system.constant";
import { AuthStore } from "../../../../../core/store/auth.store";
import { CommonDataGridComponent } from "../../../../../shared/components/common-data-grid/common-data-grid.component";
import { CommonDataGridColumnConfig } from "../../../../../shared/components/common-data-grid/model/common-data-grid.model";
import { GridBase } from "../../../../../shared/components/grid-base/grid-base";
import { API } from "../../../../../shared/constants/api-url";
import { TITLES } from "../../../../../shared/constants/title.constant";
import { NOTICE } from "../../notice/model/notice.model";
import { INoticeAudienceGroup, NoticeAudianceConst, noticeAudienceGrpStore } from "../model/notice-auduence-group.model";

@Component({
  selector: 'common-notice-audiance-group-list',
  imports: [CommonDataGridComponent],
  providers: [noticeAudienceGrpStore],
  templateUrl: './notice-audiance-group-list.html',
})
export class CommonNoticeAudianceGroupList extends GridBase<INoticeAudienceGroup> {
  private authStore = inject(AuthStore)
  protected override store = inject(noticeAudienceGrpStore);
  protected override apiEndpoint: string = API.ADMIN.COMMUNICATION.NOTICE_AUDIANCE_GROUP.LIST;
  protected override deleteEndpoint: string = API.ADMIN.COMMUNICATION.NOTICE_AUDIANCE_GROUP.DELETE;
  protected override primaryKey: keyof INoticeAudienceGroup = 'noticeGroupId';
  protected override pageTitle: string = TITLES.COMMUNICATION.NOTICE_AUDIENCE_GROUP;
  protected override routeBasePath: string = `${this.authStore.roleRoutePath().toLocaleLowerCase()}/communication/notice-audience-groups`;
  protected override deleteConfirmTitle: string = SYSTEM_CONST.ACTION_BUTTONS.DELETE;
  protected override deleteConfirmMessage = (row: INoticeAudienceGroup) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.noticeGroupName);

  protected override buildColumns(): CommonDataGridColumnConfig<INoticeAudienceGroup>[] {
    return [
      {
        field: 'noticeGroupId',
        title: '',
        isHidden: true
      },
      {
        title: NoticeAudianceConst.GROUP_NAME,
        field: 'noticeGroupName',
        isSortable: true,
      },
      {
        title: NOTICE.AUDENCE_TYPE,
        field: 'noticeAudienceTypeName',
        isSortable: true,
      },
      {
        title: SYSTEM_CONST.LABELS.COMMON.STATUS,
        field: 'isActive',
        isSortable: true,
      },
    ]
  }
}
