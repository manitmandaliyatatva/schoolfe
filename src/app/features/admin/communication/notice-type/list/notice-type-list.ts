import { Component, inject, TemplateRef, ViewChild } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { CommonDataGridComponent } from "../../../../../shared/components/common-data-grid/common-data-grid.component";
import { CommonDataGridFieldDataType } from "../../../../../shared/components/common-data-grid/enums/grid.enum";
import { CommonDataGridColumnConfig } from "../../../../../shared/components/common-data-grid/model/common-data-grid.model";
import { GridBase } from "../../../../../shared/components/grid-base/grid-base";
import { API } from "../../../../../shared/constants/api-url";
import { TITLES } from "../../../../../shared/constants/title.constant";
import { INoticeType, NOTICE_TYPE, noticeTypeStore } from "../model/notice-type.model";
import { SYSTEM_CONST } from "../../../../../core/constants/system.constant";

@Component({
    selector: 'notice-type-form',
    imports: [CommonDataGridComponent, MatIconModule],
    providers: [noticeTypeStore],
    templateUrl: "./notice-type-list.html",
    styleUrl: "./notice-type-list.scss"
})
export class NoticeTypeList extends GridBase<INoticeType> {

    protected override store = inject(noticeTypeStore);
    protected override apiEndpoint = API.ADMIN.COMMUNICATION.NOTICE_TYPE.LIST;
    protected override deleteEndpoint = API.ADMIN.COMMUNICATION.NOTICE_TYPE.DELETE;
    protected override primaryKey: keyof INoticeType = 'noticeTypeId';
    protected override pageTitle = `${TITLES.COMMUNICATION.NOTICE_TYPE}`;
    protected override routeBasePath: string = 'admin/communication/notice-types';
    protected override deleteConfirmTitle: string = NOTICE_TYPE.DELETE_NOTICE_TYPE;
    protected override deleteConfirmMessage = (row: INoticeType) => NOTICE_TYPE.CONFIRM_DELETE(row.noticeTypeName);
    
    protected override buildColumns = (): CommonDataGridColumnConfig<INoticeType>[] => {
        return [
            {
                title: NOTICE_TYPE.NOTICE_TYPE_ID,
                field: 'noticeTypeId',
                isHidden: true,
            },
            {
                title: SYSTEM_CONST.LABELS.COMMON.NAME,
                field: 'noticeTypeName',
                isSortable: true,
            },
            {
                title: SYSTEM_CONST.LABELS.COMMON.CODE,
                field: 'noticeTypeCode',
                isSortable: true,
            },
            {
                title: NOTICE_TYPE.ALLOW_ADMIN,
                field: 'allowAdmin',
                fieldDataType: CommonDataGridFieldDataType.BooleanIcon,
                isSortable: true,
            },
            {
                title: NOTICE_TYPE.ALLOW_TEACHER,
                fieldDataType: CommonDataGridFieldDataType.BooleanIcon,
                field: 'allowTeacher',
                isSortable: true,
            },
            {
                title: NOTICE_TYPE.ACTIVE,
                field: 'isActive',
                isSortable: true,
            },
        ];
    };
}