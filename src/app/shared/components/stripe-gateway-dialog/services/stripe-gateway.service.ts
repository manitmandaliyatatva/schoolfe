import { inject, Injectable } from '@angular/core';
import { GenericDialogService } from '../../../services/generic-dialog.service';
import { StripeGatewayDialogComponent } from '../stripe-gateway-dialog.component';
import { StripeGatewayConst, StripeGatewayDialogData, STRIPE_DIALOG_CONFIG } from '../models/stripe-gateway.model';

@Injectable({
  providedIn: 'root'
})
export class StripeGatewayService {
  private readonly dialogService = inject(GenericDialogService);

  open = <T>(data: StripeGatewayDialogData<T>): void => {
    this.dialogService.open({
      ...STRIPE_DIALOG_CONFIG,
      title: data.title || StripeGatewayConst.SECURE_PAYMENT,
      component: StripeGatewayDialogComponent,
      data: data
    });
  }
}
