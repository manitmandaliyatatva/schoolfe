import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ToasterService {
  private readonly snackBar = inject(MatSnackBar);

  private readonly config = {
    duration: 3000,
    horizontalPosition: 'end' as const,
    verticalPosition: 'top' as const,
  };

  success(message: string) {
    this.open(message, 'success-snackbar');
  }

  error(message: string) {
    this.open(message, 'error-snackbar');
  }

  warning(message: string) {
    this.open(message, 'warning-snackbar');
  }

  info(message: string) {
    this.open(message, 'info-snackbar');
  }

  private open(message: string, panelClass: string) {
    this.snackBar.open(message, 'Close', {
      ...this.config,
      panelClass: [panelClass],
    });
  }
}