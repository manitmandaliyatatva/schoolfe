import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'common-warning',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (warningMessage && !isError) {
      <button mat-icon-button
        [matTooltip]="warningMessage" type="button" class="warning-suffix-btn">
        <mat-icon>info</mat-icon>
      </button>
    }
  `
})
export class CommonWarningComponent implements OnInit {
  control = input<FormControl | null>(null);
  getWarning = input<((value: any) => string | null) | undefined>(undefined);
  
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const ctrl = this.control();
    if (ctrl) {
      // Trigger change detection when value changes
      ctrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.cdr.markForCheck();
      });

      // Trigger change detection when status (touched, valid/invalid) changes
      ctrl.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.cdr.markForCheck();
      });
    }
    // Perform initial check
    this.cdr.markForCheck();
  }

  get isError(): boolean {
    const ctrl = this.control();
    return !!(ctrl?.touched && ctrl?.invalid && ctrl?.errors);
  }

  get warningMessage(): string | null {
    const ctrl = this.control();
    const getWarnFn = this.getWarning();
    if (ctrl && getWarnFn) {
      return getWarnFn(ctrl.value);
    }
    return null;
  }
}
