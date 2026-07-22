import { Directive, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseNumericDirective } from './base-numeric.directive';

@Directive({
    selector: 'input[currencyMask]',
    standalone: true,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CurrencyInputDirective), multi: true }]
})
export class CurrencyInputDirective extends BaseNumericDirective {
    constructor() {
        super();
        this.clearOnZero.set(true);
    }

    protected override onBlurFormat(val: string): string {
        if (!val) return '';
        const parts = val.split('.');
        let int = parts[0] || '0';
        let dec = (parts[1] ?? '').padEnd(2, '0');
        return `${int}.${dec}`;
    }
}
