import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfirmDialog } from '../components/confirm-dialog/confirm-dialog';
import { getButtonConfig } from '../functions/config-function';
import { GenericDialogService } from './generic-dialog.service';
import { SYSTEM_CONST } from '../../core/constants/system.constant';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private readonly genericDialog = inject(GenericDialogService);

  confirm(data: { 
    title?: string, 
    message?: string, 
    confirmText?: string, 
    cancelText?: string,
    panelClass?: string
  }): Observable<boolean> {
    
    const dialogRef = this.genericDialog.open<any, boolean>({
      title: data.title || 'Confirm Action',
      component: ConfirmDialog,
      width: '400px',
      data: { message: data.message },
      showCloseButton: true,
      panelClass: data.panelClass,
      actions: [
        {
          ...getButtonConfig(() => { }, 'stroked', 'basic', data.cancelText || 'Cancel'),
          result: false,
        },
        {
          ...getButtonConfig(() => { }, 'flat', 'primary', data.confirmText || 'Confirm', true),
          result: true,
        },
      ]
    });

    return dialogRef.afterClosed();
  }

  confirmUserAction = (
    action: 'delete' | 'inactivate', 
    name: string, 
    targetType: 'user' | 'account' | 'role', 
    rolesStr: string
  ): Observable<boolean> => {
    return this.confirm({
      title: action === 'delete' ? SYSTEM_CONST.ACTION_BUTTONS.DELETE : (targetType === 'role' ? SYSTEM_CONST.ACTION_BUTTONS.INACTIVATE_ROLE : SYSTEM_CONST.ACTION_BUTTONS.INACTIVATE_USER),
      message: SYSTEM_CONST.ACTIONS.CONFIRM_USER_ACTION(action, name, targetType, rolesStr),
      confirmText: SYSTEM_CONST.ACTION_BUTTONS.CONFIRM,
      cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL
    });
  }
}
