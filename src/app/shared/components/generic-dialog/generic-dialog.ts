import { CommonModule, NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { Component, inject, Injector, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../button/button.component';
import { CommonButtonConfig } from '../button/model/button.model';
import { DialogAction, DialogOptions } from './models/config/dialog-config';
import CommonHelper from '../../../core/helpers/common-helper';

@Component({
  selector: 'app-generic-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, ButtonComponent, NgComponentOutlet, NgTemplateOutlet],
  templateUrl: './generic-dialog.html',
  styleUrl: './generic-dialog.scss',
})
export class GenericDialog {
  private readonly dialogRef = inject(MatDialogRef<GenericDialog, any>);
  private readonly parentInjector = inject(Injector);
  private readonly rawOptions = inject<DialogOptions | null>(MAT_DIALOG_DATA, { optional: true });
  readonly headerActions = signal<DialogAction[]>([]);

  readonly options: DialogOptions = {
    showHeader: true,
    showCloseButton: true,
    closeResult: false,
    ...this.rawOptions,
  };

  constructor() {
    if (this.options.headerActions) {
      this.headerActions.set(this.options.headerActions);
    }
  }

  setHeaderActions(actions: DialogAction[]): void {
    this.headerActions.set(actions);
  }

  readonly componentInjector = Injector.create({
    providers: [
      { provide: 'DIALOG_DATA', useValue: this.options.data },
      { provide: MAT_DIALOG_DATA, useValue: this.options.data },
      { provide: MatDialogRef, useValue: this.dialogRef },
      { provide: GenericDialog, useValue: this },
    ],
    parent: this.parentInjector,
  });

  readonly closeButtonConfig: CommonButtonConfig = {
    variant: 'icon',
    color: 'basic',
    icon: 'close',
    cssClasses: ['dialog-close-btn'],
    callback: () => this.closeDialog(),
  };

  closeDialog(): void {
    this.dialogRef.close(this.options.closeResult);
  }

  getActionButtonConfig(action: DialogAction): CommonButtonConfig {
    const { closeOnClick, result, ...buttonConfig } = action;

    return {
      ...buttonConfig,
      callback: (event: unknown) => this.onActionClick(action, event),
      variant: action.variant ?? 'basic',
      color: action.color ?? 'primary',
    };
  }

  onActionClick(action: DialogAction, event?: unknown): void {
    action.callback?.(event);

    const shouldClose = action.closeOnClick ?? true;
    if (shouldClose) {
      this.dialogRef.close(CommonHelper.isEmpty(action.result) ? this.options.closeResult : action.result);
    }
  }
}
