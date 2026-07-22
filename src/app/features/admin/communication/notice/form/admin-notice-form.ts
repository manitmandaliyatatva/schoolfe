import { Component } from "@angular/core";
import { CommonNoticeForm } from "../../../../common/communication/notice/form/notice-form";

@Component({
  selector: 'app-notice-form',
  imports: [CommonNoticeForm],
  template : `<common-notice-form></common-notice-form>`
})
export class AdminNoticeForm{

}