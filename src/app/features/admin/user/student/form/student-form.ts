import { Component, computed, inject, ViewChild, signal, effect, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { BasicInformationForm } from './basic-information-form/basic-information-form';
import { GuardianDetails } from './guardian-details/guardian-details';
import { OtherDetails } from './other-details/other-details';
import { DocumentUpload } from './document-upload/document-upload';
import { getButtonConfig } from '../../../../../shared/functions/config-function';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { ToastrService } from 'ngx-toastr';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { asyncScheduler, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { BaseSaveResponse } from '../../../../../core/models/email-validation.model';

@UntilDestroy()
@Component({
  selector: 'app-student-form',
  imports: [MatTabsModule, BasicInformationForm, GuardianDetails, OtherDetails, DocumentUpload, ButtonComponent],
  templateUrl: './student-form.html',
})
export class StudentForm {
  private readonly elementRef = inject(ElementRef);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly tosterService = inject(ToastrService);
  permission = computed(() => this.commonHelperService.getPermissionByPage());
  readonly SYSTEM_CONST = signal(SYSTEM_CONST);

  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  @ViewChild(BasicInformationForm) basicInfoForm!: BasicInformationForm;
  @ViewChild(GuardianDetails) guardianDetailsForm!: GuardianDetails;
  @ViewChild(OtherDetails) otherDetailsForm?: OtherDetails;
  @ViewChild(DocumentUpload) documentUploadForm?: DocumentUpload;

  // Track which tabs have errors — used to highlight tab labels in red
  readonly tabErrors = signal({
    basic: false,
    guardian: false,
    other: false,
    documents: false,
  });

  private readonly TAB_INDEX = { BASIC: 0, GUARDIAN: 1, OTHER: 2, DOCUMENTS: 3 };

  readonly isEditMode = computed(() => {
    const studentIdParam = this.route.snapshot.paramMap.get('studentId');
    return !CommonHelper.isEmpty(studentIdParam);
  });
  private readonly isSaveInitiated = signal(false);

  constructor() {
    effect(() => {
      const p = this.permission();
      if (this.isEditMode()) {
        if (!p.canView && !p.canUpdate) this.onCancel();
      } else {
        if (!p.canCreate) this.onCancel();
      }
    });

    effect(() => {
      if (!this.isSaveInitiated()) return;
      const basicSubmitting = this.basicInfoForm?.studentStore.isSubmitting() ?? false;
      const guardianSubmitting = this.guardianDetailsForm?.guardianStore.isSubmitting() ?? false;
      const otherSubmitting = this.otherDetailsForm?.otherDetailsStore.isSubmitting() ?? false;
      const docSubmitting = this.documentUploadForm?.studentDocumentStore.isSubmitting() ?? false;

      if (!basicSubmitting && !guardianSubmitting && !otherSubmitting && !docSubmitting) {
        const basicError = !!this.basicInfoForm?.studentStore.error();
        const guardianError = !!this.guardianDetailsForm?.guardianStore.error();
        const otherError = !!this.otherDetailsForm?.otherDetailsStore.error();
        const docError = !!this.documentUploadForm?.studentDocumentStore.error();

        this.tabErrors.set({ basic: basicError, guardian: guardianError, other: otherError, documents: docError });

        if (!basicError && !guardianError && !otherError && !docError) {
          this.onCancel();
        } else {
          this.isSaveInitiated.set(false);
          this.navigateToFirstErrorTab({ basicError, guardianError, otherError, docError });
        }
      }
    });
  }

  saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onSave(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.SAVE, true),
    cssClasses: ['btn', 'primary-btn'],
  });

  cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false),
    cssClasses: ['btn', 'secondary-btn'],
  });

  /** Switches to the first tab that has a validation error */
  private navigateToFirstErrorTab(errors: {
    basicError: boolean;
    guardianError: boolean;
    otherError: boolean;
    docError: boolean;
  }): void {
    if (errors.basicError) {
      this.tabGroup.selectedIndex = this.TAB_INDEX.BASIC;
    } else if (errors.guardianError) {
      this.tabGroup.selectedIndex = this.TAB_INDEX.GUARDIAN;
    } else if (errors.otherError) {
      this.tabGroup.selectedIndex = this.TAB_INDEX.OTHER;
    } else if (errors.docError) {
      this.tabGroup.selectedIndex = this.TAB_INDEX.DOCUMENTS;
    }
  }

  async onSave(): Promise<void> {
    let hasValidationError = false;

    const basicError = this.basicInfoForm?.formGroup.invalid ?? false;
    const guardianError = this.guardianDetailsForm?.hasValidationError() ?? false;
    const otherError = (this.isEditMode() && (this.otherDetailsForm?.formGroup.invalid ?? false));

    if (basicError) {
      this.basicInfoForm.formGroup.markAllAsTouched();
      hasValidationError = true;
    }
    if (guardianError) hasValidationError = true;
    if (otherError) {
      this.otherDetailsForm!.formGroup.markAllAsTouched();
      hasValidationError = true;
    }

    if (hasValidationError) {
      this.tabErrors.set({ basic: basicError, guardian: guardianError, other: otherError, documents: false });
      this.navigateToFirstErrorTab({ basicError, guardianError, otherError, docError: false });
      this.tosterService.error(SYSTEM_CONST.ERRORS.VALIDATION);
      asyncScheduler.schedule(() => {
        this.commonHelperService.scrollToInvalidController(this.elementRef.nativeElement.parentElement)
      }, 1);
      return;
    }

    this.tabErrors.set({ basic: false, guardian: false, other: false, documents: false });

    const basicFormDirty = this.basicInfoForm?.formGroup.dirty ?? false;
    const guardianFormDirty = this.guardianDetailsForm?.hasChanges() ?? false;
    const otherFormDirty = this.otherDetailsForm?.formGroup.dirty ?? false;
    const documentFormDirty = this.documentUploadForm?.isUpdated() ?? false;

    if (!basicFormDirty && !guardianFormDirty && !otherFormDirty && !documentFormDirty) {
      this.tosterService.warning(SYSTEM_CONST.MESSAGES.INFO.SAVE_NO_CHANGES);
      return;
    }

    if (!this.isEditMode() && basicFormDirty) {
      this.basicInfoForm
        .saveWithResult()
        .pipe(
          switchMap((student: BaseSaveResponse | string | null | any) => {
            if (!guardianFormDirty || !student) {
              return of(null);
            }

            const studentId = typeof student === 'string' ? student : student.data;
            return this.guardianDetailsForm.addGuardianDetailsWithResult(studentId);
          })
        )
        .pipe(untilDestroyed(this))
        .subscribe({
          next: () => this.onCancel(),
        });
      return;
    }

    this.isSaveInitiated.set(true);

    if (basicFormDirty) {
      this.basicInfoForm.onSave();
    }

    if (this.isEditMode()) {
      if (guardianFormDirty) {
        this.guardianDetailsForm.onSave();
      }
      if (otherFormDirty) {
        this.otherDetailsForm.onSave();
      }
      if (documentFormDirty) {
        this.documentUploadForm.onSave();
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['admin', 'user', 'students']);
  }
}
