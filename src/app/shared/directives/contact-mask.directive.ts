import { Directive, ElementRef, forwardRef, HostListener, inject, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { REGEX_CONST } from '../../core/constants/regex.constant';

@Directive({
    selector: 'input[contactMask]',
    standalone: true,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ContactMaskDirective), multi: true }]
})
export class ContactMaskDirective implements ControlValueAccessor {
    private readonly el = inject(ElementRef<HTMLInputElement>);
    private onChange: (v: string | null) => void = () => { };
    private onTouched: () => void = () => { };

    private prefix = signal<string>('+91 ');
    private maxLength = signal<number>(10);

    @HostListener('input') onInput() { this.onChange(this.format()); }
    @HostListener('blur') onBlur() { this.onTouched(); }

    writeValue(v: string | null | undefined) { this.el.nativeElement.value = this.display(v); }
    registerOnChange(fn: any) { this.onChange = fn; }
    registerOnTouched(fn: any) { this.onTouched = fn; }
    setDisabledState(d: boolean) { this.el.nativeElement.disabled = d; }

    private format(): string | null {
        const input = this.el.nativeElement;
        const raw = input.value.startsWith(this.prefix()) ? input.value.slice(this.prefix().length) : input.value;
        let digits = raw.replace(REGEX_CONST.NON_DIGIT, '').slice(0, this.maxLength());
        if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
        input.value = this.display(digits);
        return digits || null;
    }

    private display(v: string | null | undefined): string {
        let d = String(v ?? '').replace(REGEX_CONST.NON_DIGIT, '').slice(0, this.maxLength());
        if (d.startsWith('0')) d = d.replace(/^0+/, '');
        if (!d) return '';
        return this.prefix() + (d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d);
    }
}
