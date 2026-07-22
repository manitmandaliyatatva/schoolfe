import { Component, inject } from '@angular/core';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonNoticeList } from '../../../../common/communication/notice/list/notice-list';

@Component({
  selector: 'app-teacheer-notice-list',
  imports: [CommonNoticeList],
  template :`<common-notice-list></common-notice-list>`
})
export class TeacheerNoticeList {
}
