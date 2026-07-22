import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { ControlContainer, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonSlideToggleConfig } from './models/common-slide-toggle.model';
import { generateGUID } from '../../../core/helpers/form-utils';
import { CommonErrorComponent } from '../common-error/common-error.component';

@Component({
  selector: 'common-slide-toggle',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule, ReactiveFormsModule, CommonErrorComponent],
  templateUrl: './common-slide-toggle.html',
  styleUrl: './common-slide-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonSlideToggle implements OnInit {
  config = input.required<CommonSlideToggleConfig>();
  private readonly controlContainer = inject(ControlContainer, { optional: true });
  inputId = signal("");

  get formGroup(): FormGroup {
    return <FormGroup>this.controlContainer?.control;
  }
  
  ngOnInit(): void {
    this.inputId.set(generateGUID(this.config().formControlName))
  }

  onChange = (event: MatSlideToggleChange): void => {
    this.config().change?.(event.checked);
  }

  errorConfig = () => {
    const control = this.formGroup?.get(this.config().formControlName);

    if (!control) return undefined;

    return {
      control,
      formStatus: this.formGroup?.status ?? null,
      controlName: this.config().label
    };
  };
}
