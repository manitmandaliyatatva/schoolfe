import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

import { Observable } from 'rxjs';
import { ConfirmationService } from '../../shared/services/dialog.service';

export const pendingChangesGuard: CanDeactivateFn<any> = (component) => {
    // 1. If component implements a custom check, respect it.
    if (typeof component.canDeactivate === 'function') {
        const canDeact = component.canDeactivate();
        if (canDeact !== null && canDeact !== undefined) {
            if (canDeact === false) return promptUser();
            if (canDeact === true) return true;
        }
    }

    if (typeof component.hasUnsavedChanges === 'function') {
        const hasUnsaved = component.hasUnsavedChanges();
        if (hasUnsaved === true) return promptUser();
        if (hasUnsaved === false) return true;
    }

    // 2. If the user initiated a save, bypass the check.
    // Most forms set `isSaveClicked` or `isSaveInitiated` to true on save.
    if (typeof component.isSaveClicked === 'function' && component.isSaveClicked()) return true;
    if (component.isSaveClicked === true) return true;
    if (typeof component.isSaveInitiated === 'function' && component.isSaveInitiated()) return true;
    if (component.isSaveInitiated === true) return true;

    // 3. Generically check the DOM for dirty forms.
    // Angular automatically applies 'ng-dirty' class to FormGroup/NgForm when modified.
    const hostEl: HTMLElement | undefined = (component as any)?.elementRef?.nativeElement;
    const searchRoot = hostEl ?? document;
    const dirtyForms = searchRoot.querySelectorAll('form.ng-dirty');

    if (dirtyForms.length > 0) {
        return promptUser();
    }

    // No unsaved changes detected
    return true;
};

function promptUser(): Observable<boolean> {
    const confirmationService = inject(ConfirmationService);

    // Using the application's built-in ConfirmationService for a consistent UI
    return confirmationService.confirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to leave this page?',
        confirmText: 'Leave',
        cancelText: 'Stay',
    });
}
