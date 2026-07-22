import { AbstractControl, FormControlStatus } from "@angular/forms";

export interface ErrorMessageConfig {
    control: AbstractControl;
    formStatus: FormControlStatus | null;
    controlName?: string;
}