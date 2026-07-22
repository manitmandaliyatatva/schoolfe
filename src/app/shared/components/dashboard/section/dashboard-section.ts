import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DashboardEmptyState } from '../empty-state/dashboard-empty-state';

export interface IDashboardSectionConfig {
  title: string;
  viewAllLink?: string | any[];
  state?: any;
  showHideButton?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  onHide?: () => void;
}

@Component({
  selector: 'app-dashboard-section',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, DashboardEmptyState],
  template: `
    <div class="dashboard-section-card">
      <div class="section-header">
        <h3 class="section-title">{{ config().title }}</h3>
        
        <div class="header-actions">
          <ng-content select="[actions]"></ng-content>
        </div>

        <div class="header-controls">
          <button *ngIf="config().showHideButton !== false" mat-icon-button (click)="config().onHide?.()" matTooltip="Hide Section">
            <mat-icon>visibility</mat-icon>
          </button>
          <a *ngIf="config().viewAllLink" [routerLink]="config().viewAllLink" [state]="config().state" mat-icon-button matTooltip="View All">
            <mat-icon>open_in_new</mat-icon>
          </a>
        </div>
      </div>
      <div class="section-content">
        @if (config().isEmpty) {
          <app-dashboard-empty-state [message]="config().emptyMessage || ''" [icon]="config().emptyIcon || ''"></app-dashboard-empty-state>
        } @else {
          <ng-content></ng-content>
        }
      </div>
    </div>
  `,
  styleUrl: './dashboard-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSection {
  config = input.required<IDashboardSectionConfig>();
}
