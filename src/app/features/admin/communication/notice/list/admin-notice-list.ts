import { Component } from "@angular/core";
import { CommonNoticeList } from "../../../../common/communication/notice/list/notice-list";

@Component({
  selector: 'app-notice-list',
  imports: [CommonNoticeList],
  template: `<common-notice-list></common-notice-list>`
})
export class AdminNoticeList {
}
