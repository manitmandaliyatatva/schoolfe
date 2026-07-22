import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getFeePaymetStatusClass } from '../../../../../../shared/constants/fee-status-type.constant';

@Component({
  selector: 'app-fee-status-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fee-status-chip.component.html',
  styleUrl: './fee-status-chip.component.scss',
})
export class FeeStatusChipComponent {
  @Input() statusId: number | null | undefined;
  @Input() statusName: string | null | undefined;

  get statusLabel(): string {
    return this.statusName || '';
  }

  get statusClass(): string {
    return getFeePaymetStatusClass(Number(this.statusId));
  }
}
