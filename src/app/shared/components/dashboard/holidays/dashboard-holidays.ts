import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardSection } from '../section/dashboard-section';
import { createGenericStore } from '../../../../core/store/resource.store';
import { DASHBOARD_SHARED_CONSTANTS } from '../../../../core/constants/system.constant';
import { API } from '../../../../shared/constants/api-url';
import { AuthStore } from '../../../../core/store/auth.store';
import { DashboardListItem, IDashboardListItem } from '../list-item/dashboard-list-item';
import { Holiday } from '../../../../features/admin/configuration/holiday/models/holiday.model';
import CommonHelper from '../../../../core/helpers/common-helper';
import { CommonDateFormat } from '../../../../core/constants/date-format.constant';


export const DashboardHolidaySharedStore = createGenericStore<Holiday>();

export interface IDashboardHolidaysConfig {
  onHide?: () => void;
  data?: any[];
}

export interface IDashboardHolidayListItem extends IDashboardListItem {
  holidayId: string;
}

@Component({
  selector: 'app-dashboard-holidays',
  standalone: true,
  imports: [CommonModule, DashboardSection, DashboardListItem],
  template: `
    <app-dashboard-section
      [config]="{
        title: DASHBOARD_CONSTANTS.TITLES.HOLIDAYS,
        viewAllLink: viewAllLink(),
        isEmpty: isEmpty(),
        emptyMessage: DASHBOARD_CONSTANTS.EMPTY_STATES.HOLIDAYS,
        emptyIcon: 'beach_access',
        onHide: config()?.onHide,
      }"
    >
      <div class="dashboard-list-container">
        @for (holiday of upcomingHolidays(); track holiday.holidayId) {
          <app-dashboard-list-item [config]="holiday"></app-dashboard-list-item>
        }
      </div>
    </app-dashboard-section>
  `,
  providers: [DashboardHolidaySharedStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHolidays implements OnInit {
  private readonly holidayStore = inject(DashboardHolidaySharedStore);
  private readonly auth = inject(AuthStore);

  readonly DASHBOARD_CONSTANTS = DASHBOARD_SHARED_CONSTANTS;

  config = input<IDashboardHolidaysConfig>();
  isEmpty = computed(() => !CommonHelper.isNotEmptyArray(this.upcomingHolidays()));
  viewAllLink = computed(() =>
    this.auth.isAdmin() ? ['/admin', 'configuration', 'holidays'] : undefined,
  );

  ngOnInit(): void {
  }

  readonly upcomingHolidays = computed<IDashboardHolidayListItem[]>(() => {
    const list = this.config()?.data || this.holidayStore.list() || [];
    return list.map((holiday) => {
      let date = '';
      let badge: string | undefined = undefined;

      if (holiday.startDate && holiday.endDate) {
        const startStr = CommonHelper.toDateOnly(holiday.startDate);
        const endStr = CommonHelper.toDateOnly(holiday.endDate);
        date = holiday.startDate;

        if (startStr !== endStr) {
          const startMonth = CommonHelper.toFormattedDate(holiday.startDate, 'MMM' as CommonDateFormat);
          const endMonth = CommonHelper.toFormattedDate(holiday.endDate, 'MMM' as CommonDateFormat);
          const startDay = CommonHelper.toFormattedDate(holiday.startDate, 'd' as CommonDateFormat);
          const endDay = CommonHelper.toFormattedDate(holiday.endDate, 'd' as CommonDateFormat);

          badge = `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
        }
      } else {
        date = (holiday as any).date || holiday.startDate || '';
      }

      const item: IDashboardHolidayListItem = {
        holidayId: holiday.holidayId,
        title: holiday.name,
        subtitle: holiday.description,
        date: date,
        tooltipText: holiday.name,
        accentColor: '#ff4d4f', // Vibrant soft red for holidays
      };

      if (badge) {
        item.badge = badge;
      }

      return item;
    });
  });
}
