import { Component, computed, effect, inject, OnInit, signal } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { Router } from "@angular/router";
import { SYSTEM_CONST } from "../../../../../core/constants/system.constant";
import { ButtonType } from "../../../../../core/models/common.model";
import { CommonHelperService } from "../../../../../core/services/common-helper.service";
import { CommonButtonConfig } from "../../../../../shared/components/button/model/button.model";
import { CommonDataGridComponent } from "../../../../../shared/components/common-data-grid/common-data-grid.component";
import { CommonDataGridFieldDataType } from "../../../../../shared/components/common-data-grid/enums/grid.enum";
import { CommonDataGrid, CommonDataGridColumnConfig } from "../../../../../shared/components/common-data-grid/model/common-data-grid.model";
import { API } from "../../../../../shared/constants/api-url";
import { TITLES } from "../../../../../shared/constants/title.constant";
import { buildGridListRequest } from "../../../../../shared/helpers/grid.helper";
import { ConfirmationService } from "../../../../../shared/services/dialog.service";
import { INoticeAudianceType, NOTICE_AUDIANCE_TYPE, noticeAudianceTypeStore } from "../model/notice-audiance-type.model";

@Component({
    selector: 'notice-audience-type-form',
    imports: [CommonDataGridComponent, MatIconModule],
    providers: [noticeAudianceTypeStore],
    templateUrl: "./notice-audience-type-list.html",
})
export class NoticeAudianceTypeList implements OnInit {
    noticeTypeGridConfig!: CommonDataGrid<INoticeAudianceType>;
    private readonly router = inject(Router);
    private readonly confirmService = inject(ConfirmationService);
    readonly _noticeAudianceTypeStore = inject(noticeAudianceTypeStore);
    readonly commonHelperService = inject(CommonHelperService);
    private readonly isDeleteRequested = signal(false);

    addNoticeAudianceTypeBtnConfig = signal<CommonButtonConfig | null>(null);
    permission = computed(() => this.commonHelperService.getPermissionByPage());
    screenTitle = signal(`${TITLES.COMMUNICATION.NOTICE_AUDIANCE_TYPE}`);
    constructor() {
        effect(() => {
            if (!this.isDeleteRequested() || !this._noticeAudianceTypeStore.isSuccess()) return;
            this.isDeleteRequested.set(false);
            this.reloadList();
        });
    }
    ngOnInit(): void {
        this._noticeAudianceTypeStore.resetState();
        this.noticeTypeGridConfig = this.buildGridConfig();

        this.addNoticeAudianceTypeBtnConfig.set({
            variant: 'flat',
            color: 'primary',
            buttonText: this.commonHelperService.handleButtonText(TITLES.COMMUNICATION.NOTICE_AUDIANCE_TYPE),
            cssClasses: ['configuration-add-btn'],
            callback: this.onAddRoleClick,
        });
    }
    onAddRoleClick = (): void => {
        this.router.navigate(['admin', 'communication', 'notice-audience-types', 'add']);
    }

    private buildGridConfig = (): CommonDataGrid<INoticeAudianceType> => {
        const editBtnTxt = this.commonHelperService.handleButtonText(TITLES.USER.ROLE, ButtonType.Edit);
        const dltBtnTxt = this.commonHelperService.handleButtonText(TITLES.USER.ROLE, ButtonType.Delete);

        return {
            id: 'admin-role-grid',
            primaryKey: 'noticeAudienceTypeId',
            columns: this.buildColumns(),
            actionButtons: [
                {
                    matIconName: 'edit',
                    buttonText: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
                    tooltipText: editBtnTxt,
                    callback: this.onEditClick,
                },
                {
                    matIconName: 'delete',
                    buttonText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
                    tooltipText: dltBtnTxt,
                    callback: this.onDeleteClick,
                },
            ],
            signalStore: {
                ...this._noticeAudianceTypeStore,
                load: (filter) =>
                    this._noticeAudianceTypeStore.getAll({
                        endpoint: API.ADMIN.COMMUNICATION.NOTICE_AUDIANCE_TYPE,
                        body: buildGridListRequest(filter),
                    }),
            },
        };
    };
    private onEditClick = (row: INoticeAudianceType): void => {
        this.router.navigate(['admin', 'communication', 'notice-audience-types', 'edit', row.noticeAudienceTypeId]);
    }

    private onDeleteClick = (row: INoticeAudianceType): void => {
        this.confirmService
            .confirm({
                title: NOTICE_AUDIANCE_TYPE.DELETE_ROLE,
                message: NOTICE_AUDIANCE_TYPE.CONFIRM_DELETE(row.name),
                confirmText: NOTICE_AUDIANCE_TYPE.DELETE,
                cancelText: NOTICE_AUDIANCE_TYPE.CANCEL,
            })
            .subscribe((confirmed) => {
                if (!confirmed) return;
                this.isDeleteRequested.set(true);
                this._noticeAudianceTypeStore.remove({
                    endpoint: API.ADMIN.COMMUNICATION.DELETE_NOTICE_AUDIANCE_TYPE,
                    params: { noticeAudienceTypeId: row.noticeAudienceTypeId },
                });
            });
    }

    private reloadList = (): void => {
        this._noticeAudianceTypeStore.getAll({
            endpoint: API.ADMIN.COMMUNICATION.NOTICE_AUDIANCE_TYPE,
            body: buildGridListRequest<INoticeAudianceType>({
                pageIndex: 0,
                pageSize: 10,
                defaultSortingColumn: null,
                sortOrder: '',
                generalSearch: '',
            }),
        });
    }

    private buildColumns = (): CommonDataGridColumnConfig<INoticeAudianceType>[] => {
        return [
            {
                title: NOTICE_AUDIANCE_TYPE.NOTICE_AUDIANCE_TYPE_ID,
                field: 'noticeAudienceTypeId',
                isHidden: true,
            },
            {
                title: NOTICE_AUDIANCE_TYPE.NOTICE_AUDIANCE_TYPE_NAME,
                field: 'name',
                isSortable: true,
            },
            {
                title: NOTICE_AUDIANCE_TYPE.NOTICE_AUDIANCE_TYPE_DESCRIPTION,
                field: 'description',
                isSortable: true,
            },
            {
                title: NOTICE_AUDIANCE_TYPE.ACTIVE,
                field: 'isActive',
                isSortable: true,
            },
        ];
    };
}