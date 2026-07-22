import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { AbstractControl, ControlContainer, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { generateGUID } from '../../../core/helpers/form-utils';
import { OrientationType } from '../../models/orientation.model';
import { CommonErrorComponent } from '../common-error/common-error.component';
import {
  CommonCheckboxChangeEvent,
  CommonCheckboxConfig,
  CommonCheckboxOption,
} from './models/common-checkbox.model';

@Component({
  selector: 'common-checkbox',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, ReactiveFormsModule, CommonErrorComponent],
  templateUrl: './common-checkbox.html',
  styleUrl: './common-checkbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonCheckbox implements OnInit {
  config = input.required<CommonCheckboxConfig>();
  private readonly controlContainer = inject(ControlContainer);
  inputId = signal("");

  get orientation(): OrientationType {
    return this.config().orientation ?? "horizontal";
  }

  get isError(): boolean {
    const ctrl = this.formGroup?.get(this.config().formControlName);
    return !!(ctrl?.touched && ctrl?.errors);
  }

  get isRequired(): boolean {
    const ctrl = this.formGroup?.get(this.config().formControlName);
    return !!ctrl?.hasValidator(Validators.required);
  }

  get formGroup(): FormGroup {
    return <FormGroup>this.controlContainer.control;
  }

  get control(): AbstractControl<Array<number | string>> {
    return this.formGroup.get(this.config().formControlName)!;
  }

  get isVerticalOrientation(): boolean {
    return this.orientation === 'vertical';
  }

  ngOnInit(): void {
    this.inputId.set(generateGUID(this.config().formControlName))
  }

  isChecked = (value: number | string): boolean => {
    const controlValue = this.control.value;
    return controlValue?.includes(value) ?? false;
  }

  isDisabled = (value: number | string): boolean => {
    const isGroupDisabled = !!this.config().disabled;
    const isOptionDisabled = this.config().disableCallback?.(value) ?? false;
    return isGroupDisabled || isOptionDisabled;
  }

  getCheckboxClass = (option: CommonCheckboxOption): string => {
    return this.config().cssClassCallback?.(option) ?? '';
  }

  onCheckboxChange = (event: MatCheckboxChange, option: CommonCheckboxOption): void => {
    const currentValues = this.getCurrentValues();
    const nextValues = event.checked
      ? [...new Set([...currentValues, option.value])]
      : currentValues.filter((value) => value !== option.value);

    this.control?.setValue(nextValues);

    const payload: CommonCheckboxChangeEvent = {
      event,
      option,
      selectedValues: nextValues,
    };

    this.config().change?.(payload);
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

  private getCurrentValues = (): Array<number | string> => {
    const controlValue = this.control.value;
    return controlValue ?? [];
  }
}
