import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { DynamicForm } from '../../shared/components/dynamic-form/model/dynamic-form.model';
import { ERROR_CONST } from '../../shared/constants/error.constant';
import { REGEX_CONST } from '../constants/regex.constant';
import CommonHelper from './common-helper';

export class FormUtils {
  static phoneNumber(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    return REGEX_CONST.PHONE_NUMBER.test(String(value)) ? null : { phone: true };
  }

  static currency(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (CommonHelper.isEmpty(value)) return null;
    if (!REGEX_CONST.CURRENCY.test(String(value))) return { currency: true };
    if (Number(value) <= 0) return { minCurrenecy: { min: 0 } };
    return null;
  }

  static onlyString(control: AbstractControl, isAllowSpace: boolean = true, isAllowNumeric: boolean = false): ValidationErrors | null {
    const value = control.value;
    if (!value) return null; // let required handle empty
    
    let regex;
    let errorMessage;

    if (isAllowNumeric) {
      regex = isAllowSpace ? REGEX_CONST.ALPHANUMERIC_WITH_SPACE : REGEX_CONST.ALPHANUMERIC;
      errorMessage = isAllowSpace ? ERROR_CONST.VALIDATIONS.ONLY_ALPHANUMERIC : ERROR_CONST.VALIDATIONS.ONLY_ALPHANUMERIC_NO_SPACE;
    } else {
      regex = isAllowSpace ? REGEX_CONST.STRING : REGEX_CONST.STRING_NO_SPACE;
      errorMessage = isAllowSpace ? ERROR_CONST.VALIDATIONS.ONLY_STRING : ERROR_CONST.VALIDATIONS.ONLY_STRING_NO_SPACE;
    }

    return regex.test(String(value)) 
      ? null 
      : { onlyString: errorMessage };
  }

  static onlyStringNoSpace(control: AbstractControl): ValidationErrors | null {
    return FormUtils.onlyString(control, false);
  }

  static onlyAlphanumeric(control: AbstractControl): ValidationErrors | null {
    return FormUtils.onlyString(control, false, true);
  }
  
  static onlyAlphanumericWithSpace(control: AbstractControl): ValidationErrors | null {
    return FormUtils.onlyString(control, true, true);
  }

  static feeTypeCode(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    return REGEX_CONST.FEE_TYPE_CODE.test(String(value)) 
      ? null 
      : { feeTypeCode: ERROR_CONST.VALIDATIONS.FEE_TYPE_CODE };
  }

  static trimControl(form: AbstractControl, controlName: string): void {
    const control = form.get(controlName);
    if (control && typeof control.value === 'string') {
      const trimmedValue = control.value.trim();
      const finalValue = trimmedValue === '' ? null : trimmedValue;

      control.setValue(finalValue, { emitEvent: false });
    }
  }

  static disableDynamicFormFields(form: FormGroup, formControls: DynamicForm, fieldsToDisable: string[]): void {
    fieldsToDisable.forEach(fieldName => {
      form.get(fieldName)?.disable();

      if (formControls?.formSection) {
        formControls.formSection.forEach(section => {
          section.controls.forEach(control => {
            const ctrl = control.control as any;
            if (ctrl && ctrl.formControlName === fieldName) {
              ctrl.features = { ...(ctrl.features || {}), isDisable: true };
            }
          });
        });
      }
    });
  }

  static validateTimeRange(
    startControlName: string,
    endControlName: string,
    errorKey = 'timeRange',
    errorMessage = ERROR_CONST.VALIDATIONS.TIME_RANGE,
  ): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!(control instanceof FormGroup)) return null;

      const startControl = control.get(startControlName);
      const endControl = control.get(endControlName);
      if (!startControl || !endControl || startControl.disabled || endControl.disabled) return null;

      const startSeconds = this.getTimeInSeconds(startControl.value);
      const endSeconds = this.getTimeInSeconds(endControl.value);

      if (startSeconds === null || endSeconds === null) {
        this.clearControlError(endControl, errorKey);
        return null;
      }

      if (startSeconds >= endSeconds) {
        this.setControlError(endControl, errorKey, errorMessage);
      } else {
        this.clearControlError(endControl, errorKey);
      }

      return null;
    };
  }

  static compareValueValidator(
    compareWithControlName: string,
    isGreaterThan: boolean,
    controlTitle: string,
    compareWithControlTitle: string,
    strict = true
  ): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      let isError = false;

      if (CommonHelper.isEmpty(value) || !control.parent) {
        return null;
      }

      const compareWithControl = control.parent.get(compareWithControlName);

      if (!compareWithControl || CommonHelper.isEmpty(compareWithControl.value)) {
        return null;
      }

      const numValue = Number(value);
      const numCompare = Number(compareWithControl.value);

      if (isGreaterThan) {
        // control should be less than compareWith; error if not
        isError = strict ? numValue >= numCompare : numValue > numCompare;
      } else {
        // control should be greater than compareWith; error if not
        isError = strict ? numCompare >= numValue : numCompare > numValue;
      }

      if (!isError) {
        if (compareWithControl.hasError('compareValue')) {
          const errors = { ...compareWithControl.errors };
          delete errors['compareValue'];
          compareWithControl.setErrors(Object.keys(errors).length ? errors : null);
          compareWithControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        }
        return null;
      } else {
        const errorTemplate = isGreaterThan
          ? (strict ? ERROR_CONST.VALIDATIONS.LESS_THAN : ERROR_CONST.VALIDATIONS.LESS_THAN_OR_EQUAL)
          : (strict ? ERROR_CONST.VALIDATIONS.GREATER_THAN : ERROR_CONST.VALIDATIONS.GREATER_THAN_OR_EQUAL);
        const errorMsg = CommonHelper.interpolate(errorTemplate, {
          name: controlTitle,
          compareName: compareWithControlTitle
        });
        return { compareValue: errorMsg };
      }
    };
  }

  static validateFutureTimeIfToday(
    dateControlName: string,
    timeControlName: string,
    errorKey = 'pastTimeNotAllowed',
    errorMessage = ERROR_CONST.VALIDATIONS.PAST_TIME_NOT_ALLOWED
  ): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!(control instanceof FormGroup)) return null;

      const dateControl = control.get(dateControlName);
      const timeControl = control.get(timeControlName);

      if (!dateControl || !timeControl || dateControl.disabled || timeControl.disabled || !dateControl.value || !timeControl.value) {
        if (timeControl && timeControl.errors?.[errorKey]) {
          this.clearControlError(timeControl, errorKey);
        }
        return null;
      }

      const selectedDate = new Date(dateControl.value);
      selectedDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate.getTime() > today.getTime()) {
        this.clearControlError(timeControl, errorKey);
        return null;
      }

      if (selectedDate.getTime() === today.getTime()) {
        const timeSeconds = this.getTimeInSeconds(timeControl.value);
        const currentTime = new Date();
        const currentTimeSeconds = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();

        if (timeSeconds !== null && timeSeconds <= currentTimeSeconds) {
          this.setControlError(timeControl, errorKey, errorMessage);
        } else {
          this.clearControlError(timeControl, errorKey);
        }
      }

      return null;
    };
  }

  static getTimeInSeconds(value: Date | string | null | undefined): number | null {
    if (!value) return null;

    if (value instanceof Date) {
      return value.getHours() * 3600 + value.getMinutes() * 60 + value.getSeconds();
    }

    if (typeof value === 'string') {
      const [hh, mm, ss] = value.split(':').map((item) => Number(item));
      if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
      const seconds = Number.isFinite(ss) ? ss : 0;
      return hh * 3600 + mm * 60 + seconds;
    }

    return null;
  }

  private static setControlError(control: AbstractControl, errorKey: string, message: string): void {
    const existingErrors = control.errors ?? {};
    if (existingErrors[errorKey] === message) return;
    control.setErrors({ ...existingErrors, [errorKey]: message });
  }

  private static clearControlError(control: AbstractControl, errorKey: string): void {
    const existingErrors = control.errors;
    if (!existingErrors?.[errorKey]) return;

    const { [errorKey]: _, ...remaining } = existingErrors;
    control.setErrors(Object.keys(remaining).length ? remaining : null);
  }
}

//  TODO: Move to common helper
export const generateGUID = (formControlName: string): string => {
  return generateRandomId() + formControlName;
}
export const generateRandomId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}