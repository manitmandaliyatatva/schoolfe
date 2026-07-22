import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject, input,
    OnInit,
    signal
} from "@angular/core";
import {
    ControlContainer,
    FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators
} from "@angular/forms";
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from "@angular/material/select";
import { UntilDestroy } from "@ngneat/until-destroy";
import CommonHelper from "../../../../app/core/helpers/common-helper";
import { REGEX_CONST } from "../../../core/constants/regex.constant";
import { SYSTEM_CONST } from "../../../core/constants/system.constant";
import { FormUtils, generateGUID } from "../../../core/helpers/form-utils";
import { InputType } from "../../Enums/common.enum";
import { CommonErrorComponent } from "../common-error/common-error.component";
import { NoScrollInputDirective } from "../../directives/no-scroll-input.directive";
import { ContactMaskDirective } from "../../directives/contact-mask.directive";
import { CurrencyInputDirective } from "../../directives/currency-input.directive";
import { PercentageInputDirective } from "../../directives/percentage-input.directive";
import { NumericInputDirective } from "../../directives/numeric-input.directive";
import { Router } from '@angular/router';
import { CommonTextboxConfig, DB_MAX_LENGTHS, getLengthByContext } from "./model/textbox.model";

@UntilDestroy()
@Component({
    selector: 'common-textbox',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormField,
        MatLabel,
        MatIcon,
        MatInputModule,
        MatSelectModule,
        CommonErrorComponent,
        NoScrollInputDirective,
        ContactMaskDirective,
        CurrencyInputDirective,
        PercentageInputDirective,
        NumericInputDirective
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './textbox.component.html',
    styleUrl: './textbox.component.scss'
})
export class TextboxComponent implements OnInit {

    private controlContainer = inject(ControlContainer);
    private router = inject(Router, { optional: true });

    prefixText = computed(() => {
        if (this.config().type === InputType.currency) return SYSTEM_CONST.CURRENCY_ICON;
        if (this.config().textPrefix) return this.config().textPrefix;
        return null;
    });

    suffixText = computed(() => {
        if (this.config().type === InputType.percentage) return '%';
        if (this.config().textSuffix) return this.config().textSuffix;
        return null;
    });

    config = input.required<CommonTextboxConfig>();
    rowId = input<number>(0);
    inputId = signal("");

    effectiveMaxLength = computed(() => {
        if (this.config().maxLength !== undefined) {
            return this.config().maxLength;
        }
        const controlName = this.formControlName();
        if (this.router) {
            const contextLen = getLengthByContext(this.router.url, controlName);
            if (contextLen !== null) {
                return contextLen;
            }
        }
        return DB_MAX_LENGTHS[controlName] ?? null;
    });

    private addedValidators: ValidatorFn[] = [];

    constructor() {
        effect(() => {
            const type = this.config().type;
            const ctrl = this.control();
            if (ctrl) {
                if (this.addedValidators.length > 0) {
                    this.addedValidators.forEach(v => ctrl.removeValidators(v));
                    this.addedValidators = [];
                }

                if (type === InputType.contactNumber) {
                    this.addedValidators = [FormUtils.phoneNumber];
                } else if (type === InputType.currency) {
                    this.addedValidators = [FormUtils.currency];
                } else if (type === InputType.percentage) {
                    this.addedValidators = [Validators.min(0), Validators.max(100)];
                }

                if (this.config().allowFloatValues === false) {
                    this.addedValidators.push(Validators.pattern(REGEX_CONST.DIGIT));
                }

                const maxLen = this.effectiveMaxLength();
                if (maxLen !== null && maxLen !== undefined) {
                    this.addedValidators.push(Validators.maxLength(maxLen));
                }

                if (this.addedValidators.length > 0) {
                    this.addedValidators.forEach(v => ctrl.addValidators(v));
                }

                ctrl.updateValueAndValidity();
            }
        });
    }

    formGroup = signal<FormGroup | null>(null);
    inputTypes = InputType;

    formControlName = () => this.config().formControlName;

    control = () => this.formGroup()?.get(this.formControlName()) ?? null;

    placeholder = (): string => {
        if (!this.config().placeholder && (this.config().type === this.inputTypes.currency || this.config().type === this.inputTypes.percentage)) {
            return '0.00'
        }
        return this.config().placeholder || '';
    };

    showPassword = signal(false);

    inputType = () => {
        switch (this.config().type) {
            case InputType.email: return 'email';
            case InputType.number: return 'number';
            case InputType.password: return this.showPassword() ? 'text' : 'password';
            case InputType.textarea: return 'textarea';
            default: return 'text';
        }
    };

    togglePasswordVisibility = (): void => {
        this.showPassword.update(v => !v);
    }

    isSuffixIcon = () => !CommonHelper.isEmpty(this.config().suffixIcon)

    isHintText = () => !CommonHelper.isEmpty(this.config().hintText)


    isSuffixIconList = () => {
        return !CommonHelper.isEmpty(this.config().suffixIconList) &&
            CommonHelper.isNotEmptyArray(this.config().suffixIconList)
    }

    isPrefixIcon = () => !CommonHelper.isEmpty(this.config().prefixIcon)


    isPrefixIconList = () => !CommonHelper.isEmpty(this.config().prefixIconList) &&
        CommonHelper.isNotEmptyArray(this.config().prefixIconList)


    floatLabel = () => this.config().isFloatLabel !== false


    isError = () => {
        const ctrl = this.control();
        return !!(ctrl?.touched && ctrl?.errors);
    };

    isRequired = () => !!this.control()?.hasValidator(Validators.required);

    isPlusMiniusVisible = () => !!this.config().isPlusMinusVisible


    allowFloatValues = () => this.config().allowFloatValues ?? true


    isTextBoxDisable = () => {
        const cfg = this.config();
        if (cfg.disableCallBack) return cfg.disableCallBack(this.rowId());
        return false;
    };

    errorConfig = () => {
        const control = this.formGroup()?.get(this.formControlName());

        if (!control) return undefined;

        return {
            control,
            formStatus: this.formGroup()?.status ?? null,
            controlName: this.config().label
        };
    };

    ngOnInit(): void {
        this.inputId.set(generateGUID(this.config().formControlName));
        this.formGroup.set(this.controlContainer.control as FormGroup);
    }

    onIconClick(type: string, index: number = 0): void {
        const cfg = this.config();
        const sfixIcon = cfg.suffixIconList;
        if (type === 'suffix') {
            this.isSuffixIconList()
                ? sfixIcon![index]?.click!(index)
                : cfg?.suffixIcon!.click!();
        } else {
            this.isPrefixIconList()
                ? cfg.prefixIconList![index].click!(index)
                : cfg.prefixIcon!.click!();
        }
    }

    onSufficOptionChange = (event: any): void => {
        this.config().textSuffixSelect!.change!(event);
    }

    onImgUrlClick = (): void => {
        this.config().imgUrl!.click?.();
    }

    onKeyUp = (event: KeyboardEvent): void => {
        this.config().keyup?.(event, this.rowId());
    }

    onKeyPress = (event: KeyboardEvent): void => {
        if (this.config().allowFloatValues === false && (event.key === '.' || event.key === ',')) {
            event.preventDefault();
        }
        this.config().keypress?.(event, this.rowId());
    }

    onChange = (event: Event): void => {
        this.config().change?.(event, this.rowId());
    }

    onBlur = (event: FocusEvent): void => {
        const control = this.control();
        if (control && typeof control.value === 'string') {
            const trimmedValue = control.value.trim();
            if (control.value !== trimmedValue) {
                control.setValue(trimmedValue);
            }
        }
        this.config().blur?.(event, this.rowId());
    }
}
