import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { ControlContainer, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { generateGUID } from '../../../core/helpers/form-utils';
import { commonType, ITextValueOption } from '../../models/common.model';
import { OrientationType } from '../../models/orientation.model';
import { CommonErrorComponent } from "../common-error/common-error.component";
import { CommonRadioButtonConfig } from './models/common-radio-button.model';

@Component({
  selector: 'common-radio-button',
  standalone: true,
  imports: [CommonModule, MatRadioModule, ReactiveFormsModule, CommonErrorComponent],
  templateUrl: './common-radio-button.html',
  styleUrl: './common-radio-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonRadioButton implements OnInit {
  config = input.required<CommonRadioButtonConfig>();
  private readonly controlContainer = inject(ControlContainer);
  inputId = signal("");

  get orientation(): OrientationType {
    return this.config().orientation ?? 'horizontal';
  }

  get formGroup(): FormGroup {
    return <FormGroup>this.controlContainer.control;
  }

  get isRequired(): boolean {
    const control = this.formGroup?.get(this.config().formControlName);
    return control?.hasValidator(Validators.required) ?? false;
  }

  get isError(): boolean {
    const control = this.formGroup?.get(this.config().formControlName);
    return !!(control?.touched && control?.errors);
  }

  ngOnInit(): void {
    this.inputId.set(generateGUID(this.config().formControlName))
  }

  get isVerticalOrientation(): boolean {
    return this.orientation === 'vertical';
  }


  onChange = (event: MatRadioChange): void => {
    this.config().change?.(event);
  }

  isDisabled = (value: commonType): boolean => {
    const isGroupDisabled = !!this.config().disabled;
    const isOptionDisabled = this.config().disableCallback?.(value) ?? false;
    return isGroupDisabled || isOptionDisabled;
  }

  getRadioClass = (option: ITextValueOption): string => {
    return this.config().cssClassCallback?.(option) ?? '';
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
