import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardSection } from '../section/dashboard-section';
import { DashboardListItem } from '../list-item/dashboard-list-item';
import { AuthStore } from '../../../../core/store/auth.store';
import { createGenericStore } from '../../../../core/store/resource.store';
import { API } from '../../../../shared/constants/api-url';
import { buildGridListRequest } from '../../../../shared/helpers/grid.helper';
import { EventDto } from '../../../../features/common/calendar/calendar/models/calendar.model';
import { DASHBOARD_SHARED_CONSTANTS } from '../../../../core/constants/system.constant';

export const DashboardEventSharedStore = createGenericStore<EventDto>();

export interface IDashboardEventsConfig {
  defaultAccentColor?: string;
  onHide?: () => void;
  data?: any[];
}

@Component({
  selector: 'app-dashboard-events',
  standalone: true,
  imports: [CommonModule, DashboardSection, DashboardListItem],
  template: `
    <app-dashboard-section 
      [config]="{
        title: DASHBOARD_CONSTANTS.TITLES.EVENTS,
        viewAllLink: viewAllLink(),
        isEmpty: upcomingEvents().length === 0,
        emptyMessage: DASHBOARD_CONSTANTS.EMPTY_STATES.EVENTS,
        emptyIcon: 'event',
        onHide: config()?.onHide
      }">
      <div class="dashboard-list-container">
        @for (event of upcomingEvents(); track event.title) {
          <app-dashboard-list-item [config]="event"></app-dashboard-list-item>
        }
      </div>
    </app-dashboard-section>
  `,
  providers: [DashboardEventSharedStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardEvents implements OnInit {
  private readonly eventStore = inject(DashboardEventSharedStore);
  private readonly auth = inject(AuthStore);

  readonly DASHBOARD_CONSTANTS = DASHBOARD_SHARED_CONSTANTS;

  config = input<IDashboardEventsConfig>();

  readonly userRole = computed(() => (this.auth.usertype() as string)?.toLowerCase() || 'admin');

  ngOnInit(): void {
  }

  viewAllLink = computed(() => {
    const role = this.userRole();
    return this.auth.isAdmin() ? ['/', 'admin', 'calendar', 'calendar'] : ['/', role, 'calendar'];
  });

  upcomingEvents = computed(() => {
    const list = this.config()?.data || this.eventStore.list();
    return list.map(item => ({
      date: item.startDate as string,
      title: item.eventTitle,
      subtitle: item.isAllDay ? this.DASHBOARD_CONSTANTS.LABELS.ALL_DAY : `${new Date(item.startDate as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      location: item.location,
      accentColor: item.colorCode || this.config()?.defaultAccentColor || '#3b82f6',
      tooltipText: item.eventTypeName
    }));
  });
}
