import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IDashboardTableConfig } from './model/dashboard-table.model';

import { BooleanStatusComponent } from '../../boolean-status/boolean-status.component';

@Component({
  selector: 'app-dashboard-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, BooleanStatusComponent],
  providers: [DatePipe],
  templateUrl: './dashboard-table.html',
  styleUrl: './dashboard-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTable {
  config = input.required<IDashboardTableConfig>();
  data = input.required<any[]>();

  getRatio = (value: number, total: number): number => {
    if (!total || total === 0) return 0;
    return value / total;
  }

  getValue = (row: any, key: string): any => {
    const val = row[key];
    return (val === null || val === undefined || val === '') ? null : val;
  }

  getDisplayValue = (row: any, col: { key: string; formatter?: (value: any, row: any) => string }): string => {
    const val = this.getValue(row, col.key);
    if (col.formatter) return col.formatter(val, row);
    return val ?? '-';
  }

  getTooltip = (row: any, infoKeys?: { label: string; key: string }[]): string => {
    if (!infoKeys) return '';
    return infoKeys.map(info => `${info.label}: ${this.getValue(row, info.key) ?? 0}`).join('\n');
  }
}
