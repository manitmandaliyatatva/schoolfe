import { Component, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { HomeWorkStatus } from '../../homeworks/models/homework.model';

@Component({
  selector: 'app-homework-status-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-chip" [ngClass]="statusConfig().class">
      {{ statusConfig().text }}
    </span>
  `,
})
export class HomeworkStatusChip {
  @Input() status!: number | string | null;
  protected readonly HomeWorkStatus = HomeWorkStatus;

  statusConfig = computed(() => {
    switch (Number(this.status)) {
      case HomeWorkStatus.submitted:
        return { class: 'in-progress', text: SYSTEM_CONST.STATUS.PROGRESS.SUBMITTED };
      case HomeWorkStatus.reviewed:
        return { class: 'completed', text: SYSTEM_CONST.STATUS.PROGRESS.REVIEWED };
      case HomeWorkStatus.rejected:
        return { class: 'rejected', text: SYSTEM_CONST.STATUS.PROGRESS.REJECTED };
      case HomeWorkStatus.needsCorrection:
        return { class: 'needs-correction', text: SYSTEM_CONST.STATUS.PROGRESS.NEEDS_CORRECTION };
      case HomeWorkStatus.pending:
      default:
        return { class: 'pending', text: SYSTEM_CONST.STATUS.PROGRESS.PENDING };
    }
  });
}
