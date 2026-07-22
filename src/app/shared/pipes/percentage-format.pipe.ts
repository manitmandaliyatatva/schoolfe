import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({
    name: 'percentageFormat',
    standalone: true,
})
export class PercentageFormatPipe implements PipeTransform {
    private readonly decimalPipe = new DecimalPipe('en-US');

    transform(value: string | number | null | undefined): string {
        if (value === null || value === undefined || value === '') {
            return '0.00 %';
        }

        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) {
            return '0.00 %';
        }

        const formattedNumber = this.decimalPipe.transform(numValue, '1.2-2');
        return `${formattedNumber} %`;
    }
}
