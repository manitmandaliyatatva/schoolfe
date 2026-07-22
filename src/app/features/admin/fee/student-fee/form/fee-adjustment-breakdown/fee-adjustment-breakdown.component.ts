import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import { CurrencyFormatPipe } from '../../../../../../shared/pipes/currency-format.pipe';
import { FeeAdjustment } from '../../../fee-adjustment/model/fee-adjustment.model';

@Component({
  selector: 'app-fee-adjustment-breakdown',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe],
  templateUrl: './fee-adjustment-breakdown.component.html',
  styleUrl: '../../style/fee-breakdown-table.scss'
})
export class FeeAdjustmentBreakdownComponent {
  protected readonly SYSTEM_CONST = SYSTEM_CONST;
  data: FeeAdjustment[] = inject<FeeAdjustment[]>('DIALOG_DATA' as any);
  
  get total(): number {
    return this.data?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  }
}
