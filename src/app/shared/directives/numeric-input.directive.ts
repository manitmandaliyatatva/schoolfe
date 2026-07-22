import { Directive, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseNumericDirective } from './base-numeric.directive';

@Directive({
    selector: 'input[numericInput]',
    standalone: true,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NumericInputDirective), multi: true }]
})
export class NumericInputDirective extends BaseNumericDirective {
}
