import { inject, Injectable } from '@angular/core';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { FeeAdjustmentForm } from '../../fee-adjustment/fee-adjustment-form/fee-adjustment-form';
import { FeeAdjustmentConst, FeeAdjustmentDialogData } from '../../fee-adjustment/model/fee-adjustment.model';

@Injectable({
  providedIn: 'root'
})
export class StudentFeeDialogService {
  private readonly dialogService = inject(GenericDialogService);

  openAdjustmentDialog(data: FeeAdjustmentDialogData): void {
    this.dialogService.open({
      component: FeeAdjustmentForm,
      title: `${FeeAdjustmentConst.ADJUST_FEE}`,
      data: data,
      width: '650px'
    });
  }
}
