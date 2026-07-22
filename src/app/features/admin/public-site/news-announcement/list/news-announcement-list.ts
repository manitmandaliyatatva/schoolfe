import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { GridBase } from '../../../../../shared/components/grid-base/grid-base';
import { NewsAnnouncement, newsStore } from '../models/news-anouncement.model';
import { CommonDataGridColumnConfig } from '../../../../../shared/components/common-data-grid/model/common-data-grid.model';
import { API } from '../../../../../shared/constants/api-url';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonDataGridComponent } from '../../../../../shared/components/common-data-grid/common-data-grid.component';
import { CommonDataGridFieldDataType } from '../../../../../shared/components/common-data-grid/enums/grid.enum';

@Component({
  selector: 'app-news-announcement-list',
  imports: [CommonDataGridComponent],
  templateUrl: './news-announcement-list.html',
  styleUrl : './news-announcement-list.scss'
})
export class NewsAnnouncementList extends GridBase<NewsAnnouncement> {
  @ViewChild('metaDescription', { static: true }) metaDescription!: TemplateRef<any>;

  protected override store = inject(newsStore);
  protected override apiEndpoint: string = API.ADMIN.SITE_CONFIGURATION.NEWS_ANNOUNCEMENT.LIST;
  protected override deleteEndpoint: string = API.ADMIN.SITE_CONFIGURATION.NEWS_ANNOUNCEMENT.DELETE;
  protected override primaryKey: keyof NewsAnnouncement = 'newsId';
  protected override pageTitle: string = "New Announcements";
  protected override routeBasePath: string = "admin/site-configuration/news-announcement";
  protected override deleteConfirmTitle: string = "Delete News";
  protected override deleteConfirmMessage = (row: NewsAnnouncement) => SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(row.category);
  protected override buildColumns(): CommonDataGridColumnConfig<NewsAnnouncement>[] {
    return [
      {
        field: 'category',
        title: 'Category',
        isSortable : true
      },
      {
        field: 'title',
        title: 'Title',
        isSortable : true
      },
      {
        field: 'metaDescription',
        title: "Meta Description",
        customRenderCell: this.metaDescription,
        fieldDataType: CommonDataGridFieldDataType.CustomRenderTemplate,
        cellStyle: () => {
          return
          `.quote-text {
                height: 18px;
                width: 240px;
                padding: 0;
                overflow: hidden;
                position: relative;
                margin: 0 5px 0 5px;
                text-align: center;
                text-decoration: none;
                text-overflow: ellipsis;
                white-space: nowrap;
              }`
        }
      },
      {
        field: 'newsDate',
        isSortable : true,
        title: 'News Date',
        fieldDataType: CommonDataGridFieldDataType.Date
      }
    ]
  }
}
