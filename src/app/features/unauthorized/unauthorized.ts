import { Component, inject } from '@angular/core';
import { getButtonConfig } from '../../shared/functions/config-function';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CommonHelperService } from '../../core/services/common-helper.service';
import { SYSTEM_CONST } from '../../core/constants/system.constant';
import { AuthStore } from '../../core/store/auth.store';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <div style="text-align:center; margin-top: 100px;">
      <h2>{{SystemConst.ERRORS.UNAUTHORIZED.TITLE}}</h2>
      <p>{{SystemConst.ERRORS.UNAUTHORIZED.DETAILS}}</p>
      <common-button [config]="dashboardBtn"></common-button><br>
      <common-button [config]="logout"></common-button>
    </div>
  `
})
export class UnauthorizedComponent {
  SystemConst = SYSTEM_CONST;
  commonService = inject(CommonHelperService);
  authStore = inject(AuthStore);

  dashboardBtn = getButtonConfig(() => this.commonService.redirectToDashboard(), 'flat', 'primary', 'Go to Dashboard', true);
  logout = getButtonConfig(() => this.authStore.logout(), 'flat', 'primary', 'Logout', true);

}
