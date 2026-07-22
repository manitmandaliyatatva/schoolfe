import { createGenericStore } from "../../../../core/store/resource.store";

export interface StripeGatewayConfig<T = any> {
  amount: number;
  paymentIntentEndpoint: string;
  payload: T;
  payerName?: string;
  isEmbedded?: boolean;
  onSuccess?: (result: StripePaymentResult) => void;
  onCancel?: () => void;
  silentSuccess?: boolean;
}

export interface StripeGatewayDialogData<T = any> extends StripeGatewayConfig<T> {
  onSuccess: (result: StripePaymentResult) => void;
  title?: string;
}

export interface StripePaymentResult {
  transactionId: string;
  rawResult: any;
}

export interface StripePaymentIntentRequest {
  amount: number;
  [key: string]: any;
}

export const StripeGatewayConst = {
  SECURE_PAYMENT: 'Secure Payment',
  TOTAL_AMOUNT_TO_PAY: 'Total Amount to Pay',
  INITIALIZING_GATEWAY: 'Initializing secure gateway...',
  PAYER_NAME: 'Payer Name',
  PAYER_NAME_REQUIRED: 'Payer name is required',
  PAYMENT_METHOD: 'Payment Method',
  CONFIRM_PAYMENT: 'Confirm Payment',
  FAILED_TO_INITIALIZE: 'Failed to initialize payment gateway.',
  SERVER_ERROR_PREPARING: 'Server error while preparing payment.',
  PAYMENT_PROCESSED_SUCCESS: 'Payment processed successfully!',
  PAYMENT_FAILED: 'Payment failed'
};

export const STRIPE_DIALOG_CONFIG = {
  width: '500px',
  disableClose: true,
};

export const stripeGatewayStore = createGenericStore<StripePaymentIntentRequest>();