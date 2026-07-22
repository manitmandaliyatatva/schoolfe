import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="dashboard-empty-state">
      <div class="icon-wrap">
        <mat-icon>{{ icon() }}</mat-icon>
      </div>
      <p class="message">{{ message() }}</p>
    </div>
  `,
  styleUrl: './dashboard-empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardEmptyState {
  message = input.required<string>();
  icon = input<string>('inventory_2');
}
