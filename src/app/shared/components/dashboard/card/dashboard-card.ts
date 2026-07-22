import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface IDashboardCard {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  valueColor?: string;
  variant?: 'stats' | 'small';
}

@Component({
  selector: 'app-dashboard-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="dashboard-card" 
      [ngClass]="[config().variant || 'stats', config().icon ? 'has-icon' : '']" 
      [style.border-left-color]="config().variant === 'small' ? config().color : 'transparent'"
      [style.background-color]="config().variant === 'small' ? config().color : '#ffffff'">
      <div class="card-icon" *ngIf="config().icon" [style.background-color]="(config().color || '#e2e8f0') + '20'" [style.color]="config().color">
        <mat-icon>{{ config().icon }}</mat-icon>
      </div>
      <div class="card-content">
        <div class="card-label" [style.color]="config().valueColor || 'inherit'">{{ config().label }}</div>
        <div class="card-value" [style.color]="config().valueColor || 'inherit'">{{ config().value }}</div>
      </div>
    </div>
  `,
  styleUrl: './dashboard-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCard {
  config = input.required<IDashboardCard>();
}
