import { ChangeDetectorRef, Component, computed, effect, inject, OnDestroy, OnInit, signal, untracked } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SYSTEM_CONST } from '../../../core/constants/system.constant';
import CommonHelper from '../../../core/helpers/common-helper';
import { CommonHelperService } from '../../../core/services/common-helper.service';
import { AuthStore } from '../../../core/store/auth.store';
import { getButtonConfig } from '../../functions/config-function';
import { ITextValueOption } from '../../models/common.model';
import { DynamicFormControlType } from '../../models/form-control-base.model';
import { CommonButtonConfig } from '../button/model/button.model';
import { CommonDropdownConfig } from '../common-dropdown/model/common-dropdown.model';
import { DynamicForm } from '../dynamic-form/model/dynamic-form.model';

@Component({
  template: ''
})
export abstract class BaseFormComponent<T> implements OnInit, OnDestroy {
  protected abstract formGroup: FormGroup;
  protected abstract formControls: DynamicForm;
  protected abstract readonly store: any;

  protected abstract getByIdEndpoint: string;
  protected abstract entityIdParamKey: string;

  protected readonly router = inject(Router);
  protected readonly route = inject(ActivatedRoute);
  protected readonly commonHelperService = inject(CommonHelperService);
  protected readonly cdr = inject(ChangeDetectorRef);
  protected readonly _authStore = inject(AuthStore);
  protected restrictToCurrentYearOnly = false;
  protected disableActionsInPastAcademicYear = false;

  protected get isPastAcademicYear(): boolean {
    return CommonHelper.isPastAcademicYear(
      this._authStore.iscurrentacademicyear(),
      this._authStore.academicyearenddate()
    );
  }

  protected get isActionAllowed(): boolean {
    if (this.restrictToCurrentYearOnly) {
      return this._authStore.iscurrentacademicyear() !== false;
    }
    if (this.disableActionsInPastAcademicYear) {
      return !this.isPastAcademicYear;
    }
    return true;
  }

  protected readonly editId = signal<string | null>(null);
  protected readonly isInitialized = signal(false);

  protected readonly isEditMode = computed(() => this.editId() !== null);
  protected readonly isSaveClicked = signal(false);

  protected readonly permission = computed(() =>
    this.commonHelperService.getPermissionByPage()
  );


  protected readonly saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(
      () => this.onSave(),
      'flat',
      'primary',
      SYSTEM_CONST.ACTION_BUTTONS.SAVE,
      true
    ),
    cssClasses: ['btn', 'primary-btn'],
    visibleCallback: () => this.formGroup.enabled
  });

  protected readonly cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(
      () => this.onCancel(),
      'stroked',
      'basic',
      SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
      false
    ),
    cssClasses: ['btn', 'secondary-btn'],
  });

  constructor() {
    effect(() => {
      if (!this.isInitialized()) return;
      const p = this.permission();
      if (this.isEditMode()) {
        if (!p.canView && !p.canUpdate) this.onCancel();
        if (!p.canUpdate) this.formGroup.disable();
      } else {
        if (!p.canCreate) this.onCancel();
      }
    });

    effect(() => {
      if (this.isSaveClicked() && this.store.isSuccess()) this.onCancel();
    });

    effect(() => {
      if (!this.isEditMode()) return;
      const data = this.store.data();
      if (data) {
        untracked(() => {
          this.patchForm(data);
          if (!this.isActionAllowed) {
            this.formGroup.disable();
          }
        });
      }
    });
  }

  ngOnInit(): void {
    this.store.resetState();
    const id = this.resolveEditId();
    this.editId.set(id);
    this.loadData();
    this.buildFormControls();
    if (!this.isActionAllowed) {
      this.formGroup.disable();
      this.saveBtn.update(cfg => ({ ...cfg, isBtnVisible: () => false }));
    }
    this.isInitialized.set(true);
  }

  onSave(): void {
    // Permission guard: check canCreate for add, canUpdate for edit
    const perm = this.permission();
    if (this.isEditMode()) {
      if (!perm.canUpdate) return;
    } else {
      if (!perm.canCreate) return;
    }

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    this.isSaveClicked.set(true);
    this.submitForm();
  }

  onCancel(): void {
    this.router.navigate(this.cancelRoute());
  }

  protected resolveEditId(): string | null {
    const param = this.route.snapshot.paramMap.get(this.entityIdParamKey);
    return CommonHelper.isEmpty(param) ? null : param;
  }

  //For implementing dropdown override below method and use it in child component using super.loadDate()
  protected loadData(): void {
    if (this.isEditMode()) {
      this.store.getById({
        endpoint: this.getByIdEndpoint,
        params: { [this.entityIdParamKey]: this.editId() },
      });
    }
  }
  protected bindDropdownToControl = (
    formControlName: string,
    source: () => ITextValueOption[],
    assign: (options: ITextValueOption[]) => void,
    afterAssign?: () => void
  ): void => {
    effect(() => {
      const options = source();
      assign(options);
      this.updateDropdownData(formControlName, options);
      afterAssign?.();
    });
  };

  protected updateDropdownData = (formControlName: string, options: ITextValueOption[]): void => {
    if (!this.formControls?.formSection?.length) return;
    this.formControls = {
      formSection: this.formControls.formSection.map((section) => ({
        ...section,
        controls: section.controls.map((control) => {
          if (control.type !== DynamicFormControlType.DropDown) return control;
          const dropdownControl = control.control as CommonDropdownConfig;
          if (dropdownControl.formControlName !== formControlName) return control;
          return {
            ...control,
            control: {
              ...dropdownControl,
              data: [...options],
            },
          };
        }),
      })),
    };
    this.cdr.detectChanges();
  };

  protected abstract buildFormControls(): void;

  protected abstract patchForm(data: T): void;

  protected abstract submitForm(): void;

  protected abstract cancelRoute(): string[];

  ngOnDestroy(): void {
    this.store.resetState();
  }
}
