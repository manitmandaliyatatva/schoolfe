import { Component, computed, inject, ViewChild, signal, effect, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { getButtonConfig } from '../../../../../shared/functions/config-function';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { ToastrService } from 'ngx-toastr';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';

import { TeacherBasicInfoForm } from './basic-information-form/basic-information-form';
import { OtherDetails } from './other-details/other-details';
import { TeacherDocumentUpload } from './document-upload/document-upload';
import { TeacherQualifications } from './qualifications/teacher-qualifications';
import { asyncScheduler } from 'rxjs';
import CommonHelper from '../../../../../core/helpers/common-helper';

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [MatTabsModule, ButtonComponent, TeacherBasicInfoForm, OtherDetails, TeacherDocumentUpload, TeacherQualifications],
  templateUrl: './teacher-form.html',
})
export class TeacherForm {
  private readonly elementRef = inject(ElementRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly tosterService = inject(ToastrService);
  permission = computed(() => this.commonHelperService.getPermissionByPage());
  readonly SYSTEM_CONST = signal(SYSTEM_CONST);

  @ViewChild(TeacherBasicInfoForm) basicInfoForm!: TeacherBasicInfoForm;
  @ViewChild(OtherDetails) otherDetailsForm?: OtherDetails;
  @ViewChild(TeacherDocumentUpload) documentUploadForm?: TeacherDocumentUpload;
  @ViewChild(TeacherQualifications) qualificationsForm?: TeacherQualifications;
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;

  readonly tabErrors = signal({
    personal: false,
    other: false,
    qualifications: false,
    documents: false,
  });

  private readonly TAB_INDEX = { PERSONAL: 0, OTHER: 1, QUALIFICATIONS: 2, DOCUMENTS: 3 };

  readonly isEditMode = computed(() => {
    const teacherIdParam = this.route.snapshot.paramMap.get('teacherId');
    return !CommonHelper.isEmpty(teacherIdParam);
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
      const basicSubmitting = this.basicInfoForm?.teacherStore.isSubmitting() ?? false;
      const otherSubmitting = this.otherDetailsForm?.otherDetailsStore.isSubmitting() ?? false;
      const docSubmitting = this.documentUploadForm?.teacherDocumentStore.isSubmitting() ?? false;
      const qualSubmitting = this.qualificationsForm?.qualificationsStore.isSubmitting() ?? false;

      if (!basicSubmitting && !otherSubmitting && !docSubmitting && !qualSubmitting) {
        const basicError = !!this.basicInfoForm?.teacherStore.error();
        const otherError = !!this.otherDetailsForm?.otherDetailsStore.error();
        const docError = !!this.documentUploadForm?.teacherDocumentStore.error();
        const qualError = !!this.qualificationsForm?.qualificationsStore.error();
        this.tabErrors.set({ personal: basicError, other: otherError, qualifications: qualError, documents: docError });

        if (!basicError && !otherError && !docError && !qualError) {
          this.onCancel();
        } else {
          this.isSaveInitiated.set(false);
          this.navigateToFirstErrorTab({ basicError, otherError, docError, qualError });
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

  onSave = (): void => {
    let hasValidationError = false;
    const basicError = this.basicInfoForm?.formGroup.invalid ?? false;
    const otherError = (this.isEditMode() && (this.otherDetailsForm?.formGroup.invalid ?? false));
    const qualError = false;

    if (basicError) {
      this.basicInfoForm.formGroup.markAllAsTouched();
      hasValidationError = true;
    }

    if (otherError) {
      this.otherDetailsForm.formGroup.markAllAsTouched();
      hasValidationError = true;
    }

    if (hasValidationError) {
      this.tabErrors.set({ personal: basicError, other: otherError, qualifications: qualError, documents: false });
      this.navigateToFirstErrorTab({ basicError, otherError, docError: false, qualError });
      this.tosterService.error(SYSTEM_CONST.ERRORS.VALIDATION);
      asyncScheduler.schedule(() => {
        this.commonHelperService.scrollToInvalidController(this.elementRef.nativeElement.parentElement)
      }, 1);
      return;
    }
    this.tabErrors.set({ personal: false, other: false, qualifications: false, documents: false });

    const basicFormDirty = this.basicInfoForm?.formGroup.dirty ?? false;
    const otherFormDirty = this.otherDetailsForm?.formGroup.dirty ?? false;
    const documentFormDirty = this.documentUploadForm?.isUpdated() ?? false;
    const qualFormDirty = this.qualificationsForm?.hasChanges() ?? false;

    if (!basicFormDirty && !otherFormDirty && !documentFormDirty && !qualFormDirty) {
      this.tosterService.warning(SYSTEM_CONST.MESSAGES.INFO.SAVE_NO_CHANGES);
      return;
    }

    if (!this.isEditMode() && basicFormDirty) {
      this.basicInfoForm?.saveWithResult().subscribe((res) => {
        if (res) this.onCancel();
      });
      return;
    }

    this.isSaveInitiated.set(true);

    if (this.isEditMode()) {
      if (basicFormDirty) this.basicInfoForm?.onSave();
      if (otherFormDirty) this.otherDetailsForm?.onSave();
      if (qualFormDirty) this.qualificationsForm?.onSave();
      if (documentFormDirty) this.documentUploadForm?.onSave();
    }
  }

  onCancel = (): void => {
    this.router.navigate(['admin', 'user', 'teachers']);
  }

  private navigateToFirstErrorTab(errors: {
    basicError: boolean;
    otherError: boolean;
    docError: boolean;
    qualError: boolean;
  }): void {
    if (errors.basicError) {
      this.tabGroup.selectedIndex = this.TAB_INDEX.PERSONAL;
    } else if (errors.otherError) {
      this.tabGroup.selectedIndex = this.TAB_INDEX.OTHER;
    } else if (errors.qualError) {
      this.tabGroup.selectedIndex = this.TAB_INDEX.QUALIFICATIONS;
    } else if (errors.docError) {
      this.tabGroup.selectedIndex = this.TAB_INDEX.DOCUMENTS;
    }
  }
}

