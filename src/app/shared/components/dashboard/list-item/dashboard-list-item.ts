import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SafeImageComponent } from '../../safe-image/safe-image.component';

export interface IDashboardListItem {
  date?: Date | string;
  startTime?: string;
  endTime?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  location?: string;
  locationIcon?: string;
  footer?: string;
  accentColor?: string;
  tooltipText?: string;
  photo?: string | null;
  icon?: string;
}

@Component({
  selector: 'app-dashboard-list-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, SafeImageComponent],
  template: `
    <div class="list-item has-accent" 
         [matTooltip]="config().tooltipText || ''" matTooltipPosition="after">
      <div class="accent-bar" 
           [style.background-color]="config().accentColor || '#a1a4ad'"></div>
      
      <div class="date-box" *ngIf="config().date && !config().photo && !config().icon && !config().startTime">
        <span class="day">{{ config().date | date:'dd' }}</span>
        <span class="month">{{ config().date | date:'MMM' }}</span>
      </div>

      <div class="time-box" *ngIf="config().startTime">
        <div class="time-stack">
          <span class="time">{{ config().startTime }}</span>
          <span class="divider"></span>
          <span class="time">{{ config().endTime }}</span>
        </div>
      </div>

      <div class="image-box" *ngIf="config().photo || config().icon">
        <app-safe-image *ngIf="config().photo" [config]="{ src: config().photo!, defaultImage: '/user-default.png' }" class="item-photo"></app-safe-image>
        <div *ngIf="!config().photo && config().icon" class="item-icon-box">
          <mat-icon>{{ config().icon }}</mat-icon>
        </div>
      </div>
      
      <div class="item-details">
        <div class="item-header">
          <h4 class="item-title">{{ config().title }}</h4>
        </div>
        <div class="item-info">
          <span class="info-text" *ngIf="config().subtitle">{{ config().subtitle }}</span>
          <span class="item-badge" *ngIf="config().badge" [style.background-color]="(config().accentColor || '#3b82f6') + '15'" [style.color]="config().accentColor || '#3b82f6'">
            {{ config().badge }}
          </span>
          <span class="location-box" *ngIf="config().location">
            <mat-icon class="location-icon">{{ config().locationIcon || 'home' }}</mat-icon>
            <span class="location-text">{{ config().location }}</span>
          </span>
          <ng-content select="[info]"></ng-content>
        </div>
        <div class="item-footer" *ngIf="config().footer">
          {{ config().footer }}
        </div>
      </div>
    </div>
  `,
  styleUrl: './dashboard-list-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardListItem {
  config = input.required<IDashboardListItem>();
}
