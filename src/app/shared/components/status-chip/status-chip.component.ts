import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { StatusChipConfig } from './status-chip.model';
import { SYSTEM_CONST } from '../../../core/constants/system.constant';

/**
 * Reusable status chip component.
 *
 * Usage — simple (reads `isActive`-style boolean):
 *   <app-status-chip [config]="{ value: row.isActive }" />
 *
 * Usage — inverted logic (for `isDeleted` fields):
 *   <app-status-chip [config]="{ value: row.isDeleted, invertLogic: true }" />
 *
 * Usage — custom labels:
 *   <app-status-chip [config]="{ value: row.isActive, activeText: 'Enabled', inactiveText: 'Disabled' }" />
 */
@Component({
  selector: 'app-status-chip',
  standalone: true,
  template: `
    @if (!isHidden()) {
      <span
        class="status-chip"
        [class.active]="isActive()"
        [class.inactive]="!isActive()"
      >
        {{ isActive() ? activeLabel() : inactiveLabel() }}
      </span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusChipComponent {
  readonly config = input.required<StatusChipConfig>();

  readonly isActive = computed(() => {
    return this.config().value();
  });

  readonly isHidden = computed(() => {
    return this.config().isHidden?.() ?? false;
  });

  readonly activeLabel = computed(() => this.config().activeText ?? SYSTEM_CONST.STATUS.ACTIVE);

  readonly inactiveLabel = computed(() => this.config().inactiveText ?? SYSTEM_CONST.STATUS.INACTIVE);
}
