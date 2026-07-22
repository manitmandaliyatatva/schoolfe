import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from "@angular/core";
import { ControlContainer, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UntilDestroy } from "@ngneat/until-destroy";
import { generateGUID } from "../../../core/helpers/form-utils";
import { CommonErrorComponent } from "../common-error/common-error.component";
import { CommonColorPickerConfig } from "./model/colorpicker.model";

@UntilDestroy()
@Component({
    selector: 'app-colorpicker',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        CommonErrorComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './colorpicker.component.html',
    styleUrl: './colorpicker.component.scss'
})
export class ColorPickerComponent implements OnInit {

    private readonly controlContainer = inject(ControlContainer);

    config = input.required<CommonColorPickerConfig>();
    rowId = input<number>(0);
    inputId = signal("");

    formGroup = signal<FormGroup | null>(null);

    formControlName = () => this.config().formControlName;
    control = () => this.formGroup()?.get(this.formControlName()) ?? null;

    placeholder = (): string => this.config().placeholder || '';

    floatLabel = () => this.config().isFloatLabel !== false;

    isHintText = () => !!this.config().hintText;

    isError = () => {
        const ctrl = this.control();
        return !!(ctrl?.touched && ctrl?.errors);
    };

    isRequired = () => !!this.control()?.hasValidator(Validators.required);

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

    onChange = (event: Event): void => {
        this.config().change?.(event, this.rowId());
    }

    onColorInput = (event: Event): void => {
        const inputElement = event.target as HTMLInputElement;
        if (inputElement?.value) {
            this.control()?.patchValue(inputElement.value);
        }
    }

    onBlur = (event: FocusEvent): void => {
        this.config().blur?.(event, this.rowId());
    }
}
