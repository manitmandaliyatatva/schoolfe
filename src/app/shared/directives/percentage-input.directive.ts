import { Directive, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseNumericDirective } from './base-numeric.directive';

@Directive({
    selector: 'input[percentageMask]',
    standalone: true,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PercentageInputDirective), multi: true }]
})
export class PercentageInputDirective extends BaseNumericDirective {
    protected override onPostSanitize(val: string): string {
        if (val && parseFloat(val) > 100) {
            return '100';
        }
        return val;
    }
}
