import { Component, inject, Input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseFormComponent } from '../../../../../../shared/components/form-base/form-base';
import { DynamicForm } from '../../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../../../shared/models/form-control-base.model';
import { InputType } from '../../../../../../shared/Enums/common.enum';
import { getTextboxConfig, getDropdownConfig, getSlideToggleConfig } from '../../../../../../shared/functions/config-function';
import { API } from '../../../../../../shared/constants/api-url';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import { EMPTY_GUID } from '../../../../../../shared/constants/app.constants';
import { ButtonComponent } from '../../../../../../shared/components/button/button.component';
import { DynamicFormComponent } from '../../../../../../shared/components/dynamic-form/dynamic-form.component';
import { Page, pageStore } from '../../models/page.model';
import { ITextValueOption } from '../../../../../../shared/models/common.model';
import { FormUtils } from '../../../../../../core/helpers/form-utils';
import { UserTypeOptions, getUserType } from '../../../../../../shared/constants/user-type.constants';
import { distinctUntilChanged } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CommonTextboxConfig } from '../../../../../../shared/components/textbox/model/textbox.model';

@UntilDestroy()
@Component({
  selector: 'app-page-tab-form',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, DynamicFormComponent],
  providers: [pageStore],
  templateUrl: './page-tab-form.html'
})
export class PageTabFormComponent extends BaseFormComponent<Page> {
  private readonly fb = inject(FormBuilder);
  protected override readonly store = inject(pageStore);

  @Input() isAction: boolean = false;

  protected override getByIdEndpoint = API.ADMIN.USER.PAGES.GET;
  protected override entityIdParamKey = 'pageId';

  readonly parentPageOptions = signal<ITextValueOption[]>([]);
  readonly actionMnemonicOptions = signal<ITextValueOption[]>([]);
  private isPatching = false;

  protected override formGroup: FormGroup = this.fb.nonNullable.group({
    pageId: this.fb.control(EMPTY_GUID),
    pageName: this.fb.control('', [Validators.required, FormUtils.onlyString]),
    pageCode: this.fb.control<string | null>('', [Validators.required]),
    url: this.fb.control(''),
    parentPageId: this.fb.control<string | null>(null),
    userTypeId: this.fb.control<string | null>(null, Validators.required),
    isActive: this.fb.control(true),
    mnemonic: this.fb.control('', [Validators.required, FormUtils.onlyString]),
    isAction: this.fb.control(false),
    permissionsToCreate: this.fb.control<string[]>([]),
  });

  protected override formControls!: DynamicForm;

  private lastLoadedUserTypeId: string | null = null;

  override ngOnInit(): void {
    if (this.isAction) {
      this.formGroup.controls['pageCode'].clearValidators();
      this.formGroup.controls['pageCode'].setValue(null);
      this.formGroup.controls['pageCode'].updateValueAndValidity();

      this.formGroup.controls['url'].clearValidators();
      this.formGroup.controls['url'].updateValueAndValidity();
    } else {
      this.formGroup.controls['url'].setValidators([Validators.required]);
      this.formGroup.controls['url'].updateValueAndValidity();
    }

    super.ngOnInit();

    // Load action mnemonic dropdown options for both Page and Action forms
    this.store.getWithResult({
      endpoint: API.ADMIN.USER.PAGES.ACTION_MNEMONIC_DROPDOWN
    }).subscribe((data: any) => {
      const options = data ? data.map((item: any) => ({
        value: item.value,
        text: item.text
      })) : [];
      this.actionMnemonicOptions.set(options);

      if (this.isAction) {
        this.updateDropdownData('mnemonic', options);
      } else {
        this.updateDropdownData('permissionsToCreate', options);
      }
    });

    if (!this.isAction) {
      if (!this.isEditMode()) {
        this.formGroup.controls['pageCode'].valueChanges.pipe(distinctUntilChanged(), untilDestroyed(this)).subscribe((value) => {
          this.formGroup.controls['mnemonic'].setValue(value ?? '');
        });
      }
    }
  }

  constructor() {
    super();

    // Subscribe to userTypeId to load Parent Pages
    this.formGroup.controls['userTypeId'].valueChanges.pipe(distinctUntilChanged()).subscribe((userTypeId) => {
      this.handleUserTypeChange(userTypeId);
    });

    // Subscribe to parentPageId to update URL prefix
    this.formGroup.controls['parentPageId'].valueChanges.pipe(distinctUntilChanged()).subscribe(() => {
      this.updateUrlPrefix();
    });
  }

  private handleUserTypeChange(userTypeId: string | null): void {
    if (this.isPatching) return;
    if (userTypeId === this.lastLoadedUserTypeId) return;

    this.lastLoadedUserTypeId = userTypeId;

    if (!userTypeId) {
      this.parentPageOptions.set([]);
      this.updateDropdownData('parentPageId', []);
      this.formGroup.controls['parentPageId'].setValue(null);
      this.updateUrlPrefix();
      return;
    }

    // Call the parent dropdown endpoint
    this.store.getWithResult({
      endpoint: API.ADMIN.USER.PAGES.PARENT_DROPDOWN,
      params: { userTypeId: userTypeId, isAction: this.isAction }
    }).subscribe((data: any) => {
      const options = data ? data.map((item: any) => ({
        value: item.value,
        text: item.text
      })) : [];
      this.parentPageOptions.set(options);
      this.updateDropdownData('parentPageId', options);
      this.updateUrlPrefix();
    });
  }

  get urlPrefix(): string {
    const userTypeId = this.formGroup.get('userTypeId')?.value;
    if (!userTypeId) {
      return '';
    }
    const userTypeStr = getUserType(userTypeId).toLowerCase();

    // Find selected parent page text
    const parentPageId = this.formGroup.get('parentPageId')?.value;
    let parentPageSlug = '';
    if (parentPageId && parentPageId !== EMPTY_GUID && parentPageId !== '00000000-0000-0000-0000-000000000000') {
      const parentOpt = this.parentPageOptions().find(o => o.value === parentPageId);
      if (parentOpt && parentOpt.text) {
        parentPageSlug = '/' + parentOpt.text.toLowerCase().trim().replace(/\s+/g, '-');
      }
    }

    return `/${userTypeStr === 'superadmin' ? 'admin' : userTypeStr}${parentPageSlug}/`;
  }

  private updateUrlPrefix(): void {
    if (this.isAction) return;
    const prefix = this.urlPrefix;
    this.updateTextboxPrefix('url', prefix);
  }

  private updateTextboxPrefix(formControlName: string, prefixText: string): void {
    if (!this.formControls?.formSection?.length) return;
    this.formControls = {
      formSection: this.formControls.formSection.map((section) => ({
        ...section,
        controls: section.controls.map((control) => {
          if (control.type !== DynamicFormControlType.Text) return control;
          const textboxControl = control.control as CommonTextboxConfig;
          if (textboxControl.formControlName !== formControlName) return control;
          return {
            ...control,
            control: {
              ...textboxControl,
              textPrefix: prefixText,
            },
          };
        }),
      })),
    };
  }

  protected override loadData(): void {
    super.loadData();
    if (!this.isEditMode()) {
      this.formGroup.patchValue({ isAction: this.isAction });
      this.updateUrlPrefix();
    }
  }

  protected override buildFormControls(): void {
    const controlsList: any[] = [];

    // User Type Dropdown
    controlsList.push({
      control: {
        ...getDropdownConfig('userTypeId', SYSTEM_CONST.LABELS.USER.USER_TYPE, UserTypeOptions),
        isFloatLabel: false,
      },
      type: DynamicFormControlType.DropDown,
      class: 'col-12 col-md-6',
    });

    // Parent Page Dropdown
    controlsList.push({
      control: {
        ...getDropdownConfig('parentPageId', 'Parent Page', this.parentPageOptions()),
        isFloatLabel: false,
      },
      type: DynamicFormControlType.DropDown,
      class: 'col-12 col-md-6',
    });

    // Page Name
    controlsList.push({
      control: getTextboxConfig(
        this.isAction ? 'Action Name' : 'Page Name',
        'pageName',
        undefined,
        InputType.text,
        'outline'
      ),
      type: DynamicFormControlType.Text,
      class: 'col-12 col-md-6',
    });

    // Page Code (only for Page tab)
    if (!this.isAction) {
      controlsList.push({
        control: getTextboxConfig('Page Code', 'pageCode', undefined, InputType.text, 'outline'),
        type: DynamicFormControlType.Text,
        class: 'col-12 col-md-6',
      });
    }

    // URL (only for Page tab)
    if (!this.isAction) {
      controlsList.push({
        control: {
          ...getTextboxConfig('URL', 'url', undefined, InputType.text, 'outline'),
          textPrefix: this.urlPrefix
        },
        type: DynamicFormControlType.Text,
        class: 'col-12 col-md-6',
      });
    }

    // Mnemonic
    if (this.isAction && !this.isEditMode()) {
      controlsList.push({
        control: {
          ...getDropdownConfig('mnemonic', 'Mnemonic', this.actionMnemonicOptions()),
          isFloatLabel: false,
        },
        type: DynamicFormControlType.DropDown,
        class: 'col-12 col-md-6',
      });
    } else {
      controlsList.push({
        control: {
          ...getTextboxConfig('Mnemonic', 'mnemonic', undefined, InputType.text, 'outline'),
          keypress: (event: KeyboardEvent) => {
            if (event.key === ' ') {
              event.preventDefault();
            }
          }
        },
        type: DynamicFormControlType.Text,
        class: 'col-12 col-md-6',
      });
    }

    // Is Active status toggle
    controlsList.push({
      control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE),
      type: DynamicFormControlType.SlideToggle,
      class: 'col-12 col-md-6',
    });

    // Permissions multi-select dropdown (only for Page tab)
    // if (!this.isAction) {
    //   controlsList.push({
    //     control: {
    //       ...getDropdownConfig('permissionsToCreate', 'Add Actions/Permissions', this.actionMnemonicOptions()),
    //       isFloatLabel: false,
    //       features: {
    //         allowMultiple: true,
    //         allowClear: true,
    //         allowSearching: true
    //       }
    //     },
    //     type: DynamicFormControlType.DropDown,
    //     class: 'col-12 col-md-6',
    //   });
    // }

    this.formControls = {
      formSection: [
        {
          title: this.isAction ? 'Action Details' : 'Page Details',
          controls: controlsList,
        },
      ],
    };

    if (this.isEditMode() || (!this.isAction && !this.isEditMode())) {
      FormUtils.disableDynamicFormFields(this.formGroup, this.formControls, ['mnemonic']);
    }
  }

  protected override patchForm(data: Page): void {
    this.isPatching = true;
    this.lastLoadedUserTypeId = data.userTypeId ?? null;

    let displayUrl = data.url ?? '';
    if (displayUrl) {
      const trimmedUrl = displayUrl.replace(/^\/|\/$/g, '');
      const segments = trimmedUrl.split('/');
      displayUrl = segments[segments.length - 1] || '';
    }

    this.formGroup.patchValue({
      pageId: data.pageId ?? EMPTY_GUID,
      pageName: data.pageName ?? '',
      pageCode: this.isAction ? null : (data.pageCode ?? ''),
      url: displayUrl,
      parentPageId: (data.parentPageId === EMPTY_GUID || data.parentPageId === '00000000-0000-0000-0000-000000000000') ? null : (data.parentPageId ?? null),
      userTypeId: data.userTypeId ?? null,
      isActive: data.isActive ?? true,
      mnemonic: data.mnemonic ?? '',
      isAction: data.isAction ?? false,
      permissionsToCreate: data.permissionsToCreate ?? []
    }, { emitEvent: false });

    if (data.userTypeId) {
      this.store.getWithResult({
        endpoint: API.ADMIN.USER.PAGES.PARENT_DROPDOWN,
        params: { userTypeId: data.userTypeId, isAction: this.isAction }
      }).subscribe((dropData: any) => {
        const options = dropData ? dropData.map((item: any) => ({
          value: item.value,
          text: item.text
        })) : [];
        this.parentPageOptions.set(options);
        this.updateDropdownData('parentPageId', options);

        // Restore parentPageId value after dropdown loads
        const parentPageVal = (data.parentPageId === EMPTY_GUID || data.parentPageId === '00000000-0000-0000-0000-000000000000') ? null : (data.parentPageId ?? null);
        this.formGroup.patchValue({ parentPageId: parentPageVal }, { emitEvent: false });

        this.isPatching = false;
        this.updateUrlPrefix();
      });
    } else {
      this.isPatching = false;
      this.updateUrlPrefix();
    }
  }

  protected override submitForm(): void {
    const rawVal = this.formGroup.getRawValue();
    if (!rawVal.parentPageId) {
      rawVal.parentPageId = null;
    }
    rawVal.isAction = this.isAction;

    if (!this.isAction) {
      const prefix = this.urlPrefix;
      const suffix = (rawVal.url ?? '').replace(/^\/|\/$/g, '');
      let finalUrl = prefix + suffix;
      finalUrl = finalUrl.replace(/\/+$/, '');
      rawVal.url = finalUrl;
    } else {
      rawVal.url = '';
      rawVal.pageCode = null;
    }

    this.store.create({
      endpoint: API.ADMIN.USER.PAGES.ADDUPDATE,
      body: rawVal,
    });
  }

  protected override cancelRoute(): string[] {
    return ['admin', 'user', 'pages'];
  }

  override onCancel(): void {
    this.router.navigate(this.cancelRoute(), {
      queryParams: { isAction: this.isAction }
    });
  }
}
