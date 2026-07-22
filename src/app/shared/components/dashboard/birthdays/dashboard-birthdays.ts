import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DashboardSection } from '../section/dashboard-section';
import { createGenericStore } from '../../../../core/store/resource.store';
import { DASHBOARD_SHARED_CONSTANTS } from '../../../../core/constants/system.constant';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DashboardListItem, IDashboardListItem } from '../list-item/dashboard-list-item';

export interface DashboardBirthday {
  photo: string | null;
  name: string;
  isTeacher: boolean;
  classSectionName: string;
}

export const DashboardBirthdaySharedStore = createGenericStore<DashboardBirthday>();

export interface IDashboardBirthdaysConfig {
  onHide?: () => void;
  data?: any[];
}

@Component({
  selector: 'app-dashboard-birthdays',
  standalone: true,
  imports: [CommonModule, DashboardSection, MatIconModule, MatTooltipModule, DashboardListItem],
  template: `
    <app-dashboard-section 
      [config]="{
        title: DASHBOARD_CONSTANTS.TITLES.BIRTHDAYS,
        isEmpty: birthdays().length === 0,
        emptyMessage: DASHBOARD_CONSTANTS.EMPTY_STATES.BIRTHDAYS,
        emptyIcon: 'cake',
        onHide: config().onHide
      }">
      <div class="dashboard-list-container birthday-list">
        @for (person of birthdays(); track person.name) {
          <app-dashboard-list-item [config]="mapToListItem(person)"></app-dashboard-list-item>
        }
      </div>
    </app-dashboard-section>
  `,
  styles: [`
    .birthday-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 8px;

      /* Custom Scrollbar */
      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
        &:hover {
          background: #cbd5e1;
        }
      }
    }
  `],
  providers: [DashboardBirthdaySharedStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
@UntilDestroy()
export class DashboardBirthdays implements OnInit {
  private readonly birthdayStore = inject(DashboardBirthdaySharedStore);

  readonly DASHBOARD_CONSTANTS = DASHBOARD_SHARED_CONSTANTS;

  config = input.required<IDashboardBirthdaysConfig>();

  readonly birthdays = computed(() => this.config()?.data || this.birthdayStore.list());

  ngOnInit(): void {
  }

  mapToListItem(person: DashboardBirthday): IDashboardListItem {
    return {
      title: person.name,
      subtitle: person.isTeacher ? this.DASHBOARD_CONSTANTS.LABELS.TEACHER : person.classSectionName,
      photo: person.photo,
      icon: person.isTeacher ? 'person' : 'school',
      tooltipText: this.DASHBOARD_CONSTANTS.ACTIONS.WISH_BIRTHDAY(person.name),
      accentColor: person.isTeacher ? '#10b981' : '#3b82f6'
    };
  }
}
