import { Directive, ElementRef, HostListener, inject, input, signal } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';

@Directive()
export abstract class BaseNumericDirective implements ControlValueAccessor {
    protected readonly el = inject(ElementRef<HTMLInputElement>);
    protected onChange: (v: string | null) => void = () => { };
    protected onTouched: () => void = () => { };

    maxIntegerDigits = input(8);
    maxDecimalDigits = input(2);
    /** If true, 0, '0', or '0.00' will be treated as an empty string in writeValue */
    clearOnZero = signal(false);

    @HostListener('input') onInput() {
        const input = this.el.nativeElement;
        const cursorPos = input.selectionStart ?? 0;
        const oldVal = input.value;

        // Strip everything except digits and dot
        let val = oldVal.replace(/[^\d.]/g, '');
        
        // Handle multiple dots - keep only the first one
        const firstDotIndex = val.indexOf('.');
        if (firstDotIndex !== -1) {
            val = val.slice(0, firstDotIndex + 1) + val.slice(firstDotIndex + 1).replace(/\./g, '');
        }

        // If decimals are disabled, strip the dot and everything after
        if (this.maxDecimalDigits() === 0) {
            val = val.replace(/\./g, '');
        }

        const parts = val.split('.');

        // Allow specified digits before decimal and after
        let int = parts[0].slice(0, this.maxIntegerDigits());
        let dec = parts.length > 1 && this.maxDecimalDigits() > 0 ? parts[1].slice(0, this.maxDecimalDigits()) : undefined;

        val = dec !== undefined ? `${int}.${dec}` : int;

        // Hook for extra sanitization (e.g. max value limit)
        val = this.onPostSanitize(val);

        // Calculate how many characters were removed before the cursor
        const diff = oldVal.length - val.length;
        const newCursor = Math.max(0, cursorPos - diff);

        input.value = val;
        input.setSelectionRange(newCursor, newCursor);
        this.onChange(val || null);
    }

    @HostListener('blur') onBlur() {
        this.onTouched();
        const formatted = this.onBlurFormat(this.el.nativeElement.value);
        if (formatted !== this.el.nativeElement.value) {
            this.el.nativeElement.value = formatted;
            this.onChange(formatted || null);
        }
    }

    writeValue(v: any) {
        if (v === null || v === undefined || v === '') {
            this.el.nativeElement.value = '';
            return;
        }

        // Restore legacy behavior for currency/numeric if needed
        if (this.clearOnZero()) {
            const numValue = parseFloat(String(v).replace(/[^\d.]/g, ''));
            if (isNaN(numValue) || numValue === 0) {
                this.el.nativeElement.value = '';
                return;
            }
        }

        let val = String(v).replace(/[^\d.]/g, '');
        
        const firstDotIndex = val.indexOf('.');
        if (firstDotIndex !== -1) {
            val = val.slice(0, firstDotIndex + 1) + val.slice(firstDotIndex + 1).replace(/\./g, '');
        }

        const parts = val.split('.');
        const int = parts[0].slice(0, this.maxIntegerDigits());
        const dec = parts.length > 1 && this.maxDecimalDigits() > 0 ? parts[1].slice(0, this.maxDecimalDigits()) : undefined;
        
        val = dec !== undefined ? `${int}.${dec}` : int;
        this.el.nativeElement.value = this.onBlurFormat(val);
    }

    registerOnChange(fn: any) { this.onChange = fn; }
    registerOnTouched(fn: any) { this.onTouched = fn; }
    setDisabledState(d: boolean) { this.el.nativeElement.disabled = d; }

    /** Override this to limit values (e.g. 100 for percentage) */
    protected onPostSanitize(val: string): string {
        return val;
    }

    /** Override this to add padding or other formatting on blur */
    protected onBlurFormat(val: string): string {
        return val;
    }
}
