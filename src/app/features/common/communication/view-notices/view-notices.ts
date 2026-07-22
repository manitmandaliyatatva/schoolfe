import { Component, effect, HostBinding, inject, input, TemplateRef, ViewChild } from '@angular/core';
import { AuthStore } from '../../../../core/store/auth.store';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { CommonDataGridColumnConfig } from '../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { GridBase } from '../../../../shared/components/grid-base/grid-base';
import { createGenericStore } from '../../../../core/store/resource.store';
import { API } from '../../../../shared/constants/api-url';
import { CommonDataGridFieldDataType } from '../../../../shared/components/common-data-grid/enums/grid.enum';
import { CommonDataGridComponent } from '../../../../shared/components/common-data-grid/common-data-grid.component';
import { DashboardListItem } from '../../../../shared/components/dashboard/list-item/dashboard-list-item';
import { DashboardEmptyState } from '../../../../shared/components/dashboard/empty-state/dashboard-empty-state';
import { DASHBOARD_SHARED_CONSTANTS } from '../../../../core/constants/system.constant';
import { NoticeDetailDialog } from '../../../../shared/components/notice-detail-dialog/notice-detail-dialog';
import { buildGridListRequest } from '../../../../shared/helpers/grid.helper';

export interface NoticeDto {
  noticeId: string;
  title: string;
  description: string;
  noticeTypeId: string;
  noticeTypeName: string;
  noticeGroupId: string;
  noticeGroupName: string;
  publishDate: string;
  expiryDate: string | null;
  isImportant: boolean;
  isPublished: boolean;
  attachmentFileName: string;
  attachmentFilePath: string;
  noticeFile: string;
  isFileDeleted: boolean;
  isActive: boolean;
  audiences: any[];
}

export const noticeStore = createGenericStore<NoticeDto>();

@Component({
  selector: 'app-view-notices',
  standalone: true,
  imports: [
    CommonModule,
    CommonDataGridComponent,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatDividerModule,
    DatePipe,
    MatDialogModule,
    DashboardListItem,
    DashboardEmptyState,
  ],
  templateUrl: './view-notices.html',
  styleUrl: './view-notices.scss',
})
export class ViewNotices extends GridBase<NoticeDto> {
  @ViewChild('noticeUI', { static: true }) noticeUI!: TemplateRef<any>;

  isDashboardMode = input<boolean>(false);
  providedData = input<any>(null);

  protected override store = inject(noticeStore);
  protected override apiEndpoint!: string;
  protected override deleteEndpoint!: string;
  protected override primaryKey: keyof NoticeDto = 'noticeId';
  protected override pageTitle: string = 'Notices';
  protected override routeBasePath!: string;
  protected override deleteConfirmTitle!: string;
  protected override deleteConfirmMessage!: (row: NoticeDto) => string;

  readonly DASHBOARD_CONSTANTS = DASHBOARD_SHARED_CONSTANTS;
  private readonly dialog = inject(MatDialog);
  protected override isAddButton = () => false;

  private readonly auth = inject(AuthStore);

  constructor() {
    super();
    effect(() => {
      const isDashboard = this.isDashboardMode();
      if (isDashboard) {
        const data = this.providedData();
        if (data) {
          this.store.setGenericState({
            list: data.data || [],
            totalRecords: data.recordsTotal || 0
          });
        }
      }
    });
  }

  override ngOnInit(): void {
    const isDashboard = this.isDashboardMode();

    this.apiEndpoint = isDashboard
      ? ''
      : API.ADMIN.COMMUNICATION.NOTICE.RELATED_NOTICE;

    this.isPostMode = !isDashboard;

    super.ngOnInit();
  }

  protected override signalStore = () => {
    return {
      ...this.store,
      load: (filter: any) => {
        if (this.isDashboardMode()) {
          // Do not fetch from API in dashboard mode, data is provided externally
          return;
        }
        this.onGridStateChange(filter);
        this.store.getAll({
          endpoint: this.apiEndpoint,
          body: this.isPostMode ? buildGridListRequest(filter) : null,
        });
      }
    };
  }

  protected override buildColumns(): CommonDataGridColumnConfig<NoticeDto>[] {
    return [
      {
        title: 'Notices',
        field: 'title',
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        customRenderCell: this.noticeUI,
      }
    ];
  }

  @HostBinding('class.dashboard-mode')
  get isDashboard(): boolean {
    return this.isDashboardMode();
  }

  onEdit(notice: NoticeDto) {
    this.dialog.open(NoticeDetailDialog, {
      width: '520px',
      autoFocus: false,
      data: notice
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
