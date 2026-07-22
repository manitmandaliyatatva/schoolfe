import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardSection } from '../section/dashboard-section';
import { ViewNotices } from '../../../../features/common/communication/view-notices/view-notices';
import { AuthStore } from '../../../../core/store/auth.store';
import { DASHBOARD_SHARED_CONSTANTS } from '../../../../core/constants/system.constant';

export interface IDashboardNoticesConfig {
  onHide?: () => void;
  data?: any;
}

@Component({
  selector: 'app-dashboard-notices',
  standalone: true,
  imports: [CommonModule, DashboardSection, ViewNotices],
  template: `
    <app-dashboard-section 
      [config]="{
        title: DASHBOARD_CONSTANTS.TITLES.NOTICES,
        viewAllLink: viewAllLink(),
        onHide: config()?.onHide
      }">
      <app-view-notices [isDashboardMode]="true" [providedData]="config()?.data"></app-view-notices>
    </app-dashboard-section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardNotices {
  private readonly auth = inject(AuthStore);

  readonly DASHBOARD_CONSTANTS = DASHBOARD_SHARED_CONSTANTS;

  config = input<IDashboardNoticesConfig>();

  readonly userRole = computed(() => (this.auth.roleRoutePath() as string)?.toLowerCase() || 'admin');

  viewAllLink = computed(() => {
    const role = this.userRole();
    return ['/', role, 'notices'];
  });
}
