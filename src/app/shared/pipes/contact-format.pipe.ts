import { Pipe, PipeTransform, signal } from '@angular/core';
import { REGEX_CONST } from '../../core/constants/regex.constant';

@Pipe({
    name: 'contactFormat',
    standalone: true
})
export class ContactFormatPipe implements PipeTransform {
    private readonly prefix = signal<string>('+91 ');
    private readonly maxLength = signal<number>(10);

    transform(value: string | number | null | undefined): string {
        if (!value) return '';

        const d = String(value).replace(REGEX_CONST.NON_DIGIT, '').slice(0, this.maxLength());
        if (!d) return '';

        return this.prefix() + (d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d);
    }
}
