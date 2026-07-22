import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SYSTEM_CONST } from '../../core/constants/system.constant';

@Pipe({
    name: 'currencyFormat',
    standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
    private readonly decimalPipe = new DecimalPipe('en-US');

    transform(value: string | number | null | undefined): string {
        if (value === null || value === undefined || value === '') {
            return `${SYSTEM_CONST.CURRENCY_ICON} 0.00`;
        }

        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) {
            return `${SYSTEM_CONST.CURRENCY_ICON} 0.00`;
        }

        const formattedNumber = this.decimalPipe.transform(numValue, '1.2-2');
        return `${SYSTEM_CONST.CURRENCY_ICON} ${formattedNumber}`;
    }
}
