import { Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { FormUtils } from '../../../../../core/helpers/form-utils';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { AuthStore } from '../../../../../core/store/auth.store';
import { CommonDropdownStore } from '../../../../../core/store/common-dropdown.store';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { API } from '../../../../../shared/constants/api-url';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';
import { LookupMnemonics } from '../../../../../shared/constants/lookup-type-ids.constant';
import { UserTypeConst } from '../../../../../shared/constants/user-type.constants';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getButtonConfig, getDropdownConfig, getSlideToggleConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { DOCUMENT_TYPE_CONST, DocumentType, documentTypeStore } from '../models/document-type.model';

@Component({
  selector: 'app-document-type-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, MatButtonModule, ButtonComponent],
  providers: [documentTypeStore],
  templateUrl: './document-type-form.html',
})
export class DocumentTypeForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly commonHelperService = inject(CommonHelperService);
  readonly documentTypeStore = inject(documentTypeStore);
  private readonly dropdownStore = inject(CommonDropdownStore);
  private readonly authStore = inject(AuthStore);

  private readonly editDocumentTypeId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.editDocumentTypeId() !== null);
  readonly isSaveClicked = signal<boolean>(false);
  permission = computed(() => this.commonHelperService.getPermissionByPage());
  saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onSave(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.SAVE, true),
    cssClasses: ['btn', 'primary-btn'],
  });
  cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false),
    cssClasses: ['btn', 'secondary-btn'],
  });

  formGroup = this.fb.nonNullable.group({
    documentTypeId: this.fb.control(EMPTY_GUID),
    documentTypeName: this.fb.control('', [Validators.required, FormUtils.onlyString]),
    userTypeId: this.fb.control<string | null>(null, Validators.required),
    isActive: this.fb.control(true),
  });

  formControls!: DynamicForm;
  private readonly DROPDOWN_KEY = 'documentTypeUserTypeList';
  protected readonly userTypeList = this.dropdownStore.getList(this.DROPDOWN_KEY);

  constructor() {
    effect(() => {
      const p = this.permission();
      if (this.isEditMode()) {
        if (!p.canView && !p.canUpdate) this.onCancel();
        if (!p.canUpdate) this.formGroup.disable();
      } else {
        if (!p.canCreate) this.onCancel();
      }
    });
    effect(() => {
      if (this.isSaveClicked() && this.documentTypeStore.isSuccess()) {
        this.onCancel();
      }
    });

    effect(() => {
      if (!this.isEditMode()) return;
      const documentTypeData = this.documentTypeStore.data();
      if (!documentTypeData) return;
      this.patchForm(documentTypeData);
    });

    effect(() => {
      let options = this.userTypeList();
      if (this.authStore.usertype() === 'Admin') {
        options = options.filter(x => (x.value as string)?.toLowerCase() !== UserTypeConst.Admin.toLowerCase());
      }
      untracked(() => {
        if (this.formControls) {
          const control = this.formControls.formSection[0].controls.find(c => (c.control as any).formControlName === 'userTypeId');
          if (control) {
            (control.control as any).data = options;
            control.control = { ...control.control };
            this.formControls = { ...this.formControls };
          }
        }
      });
    });
  }

  ngOnInit(): void {
    this.documentTypeStore.resetState();
    this.resolveEditMode();

    this.dropdownStore.getDropdown({
      key: this.DROPDOWN_KEY,
      endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
      params: { mnemonic: LookupMnemonics.UserTypeIds }
    });

    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: getTextboxConfig(DOCUMENT_TYPE_CONST.DOCUMENT_TYPE_NAME, 'documentTypeName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                ...getDropdownConfig('userTypeId', SYSTEM_CONST.LABELS.USER.USER_TYPE, []),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
          ],
        },
      ],
    };
  }

  onSave = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.isSaveClicked.set(true);
    this.documentTypeStore.create({
      endpoint: API.ADMIN.CONFIGURATION.DOCUMENT_TYPE.ADDUPDATE,
      body: this.formGroup.getRawValue() as DocumentType,
    });
  };

  onCancel = (): void => {
    this.router.navigate(['admin', 'configuration', 'document-types']);
  };

  private resolveEditMode = (): void => {
    const documentTypeIdParam = this.route.snapshot.paramMap.get('documentTypeId');
    if (CommonHelper.isEmpty(documentTypeIdParam)) return;

    this.editDocumentTypeId.set(documentTypeIdParam);

    this.documentTypeStore.getById({
      endpoint: API.ADMIN.CONFIGURATION.DOCUMENT_TYPE.GET,
      params: { documentTypeId: documentTypeIdParam },
    });
  };

  private patchForm = (documentType: DocumentType): void => {
    this.formGroup.patchValue({
      documentTypeId: CommonHelper.resolveId(documentType.documentTypeId),
      documentTypeName: documentType.documentTypeName ?? '',
      userTypeId: documentType.userTypeId?.toLowerCase() ?? null,
      isActive: documentType.isActive ?? true,
    });
  };
}
