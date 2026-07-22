import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CommonDropdownStore } from "../../../../../core/store/common-dropdown.store";
import { ButtonComponent } from "../../../../../shared/components/button/button.component";
import { DynamicFormComponent } from "../../../../../shared/components/dynamic-form/dynamic-form.component";
import { DynamicForm } from "../../../../../shared/components/dynamic-form/model/dynamic-form.model";
import { BaseFormComponent } from "../../../../../shared/components/form-base/form-base";
import { API } from "../../../../../shared/constants/api-url";
import { TITLES } from "../../../../../shared/constants/title.constant";
import { InputType } from "../../../../../shared/Enums/common.enum";
import { getTextboxConfig, getDropdownConfig, getSlideToggleConfig, getDropdownConfigWithLazyLoading } from "../../../../../shared/functions/config-function";
import { ITextValueOption } from "../../../../../shared/models/common.model";
import { DynamicFormControlType } from "../../../../../shared/models/form-control-base.model";
import { NOTICE } from "../../notice/model/notice.model";
import { INoticeAudienceGroup, genericDropdownStore, noticeAudienceGrpStore, IMapAPIByKeyForNotice, MapAPIByKey } from "../model/notice-auduence-group.model";
import { INoticeAudianceType } from "../../../../admin/communication/notice-audiance-type/model/notice-audiance-type.model";
import { AuthStore } from "../../../../../core/store/auth.store";
import { SYSTEM_CONST } from "../../../../../core/constants/system.constant";
import { EMPTY_GUID } from "../../../../../shared/constants/app.constants";
import CommonHelper from "../../../../../core/helpers/common-helper";

@Component({
  selector: 'common-notice-audiance-group-form',
  imports: [DynamicFormComponent, ButtonComponent, ReactiveFormsModule],
  templateUrl: './notice-audiance-group-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommmonNoticeAudianceGroupForm extends BaseFormComponent<INoticeAudienceGroup> implements OnDestroy, OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly DROPDOWN_KEYS = {
    noticeAudienceType: 'noticeAudienceType',
  } as const;

  private noticeAudienceType: ITextValueOption[] = [];
  readonly dropdownStore = inject(CommonDropdownStore);
  readonly genericDropdownStore = inject(genericDropdownStore)

  private readonly fb = inject(FormBuilder);
  protected override formGroup: FormGroup<any> = this.fb.nonNullable.group({
    noticeGroupId: this.fb.control<string | null>(EMPTY_GUID),
    noticeGroupName: this.fb.control('', Validators.required),
    noticeAudienceTypeId: this.fb.control<string | null>(null, Validators.required),
    noticeAudienceTypeName: this.fb.control(''),
    refIds: this.fb.control([], Validators.required),
    isActive: this.fb.control(true),
  });

  protected override formControls: DynamicForm;
  protected override store = inject(noticeAudienceGrpStore);
  protected override getByIdEndpoint: string = API.ADMIN.COMMUNICATION.NOTICE_AUDIANCE_GROUP.GET;
  protected override entityIdParamKey: string = 'noticeGroupId';
  private isSetValue = signal<boolean>(false);

  currentConfig = signal<IMapAPIByKeyForNotice>(null);

  constructor() {
    super();
    this.bindDropdownToControl('noticeAudienceTypeId', this.dropdownStore.getList(this.DROPDOWN_KEYS.noticeAudienceType), (options) => {
      this.noticeAudienceType = options;
    });
  }
  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.dropdownStore.resetState();
    this.genericDropdownStore.resetState();
  }

  protected override loadData(): void {
    super.loadData();
    this.dropdownStore.getDropdown<INoticeAudianceType>({
      key: this.DROPDOWN_KEYS.noticeAudienceType,
      endpoint: API.ADMIN.COMMUNICATION.NOTICE_AUDIANCE_TYPE_DROPDOWN,
    });
  }

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          title: NOTICE.BASIC_INFORMATION,
          controls: [
            {
              control: getTextboxConfig(NOTICE.NOTICE_GROUP_NAME, 'noticeGroupName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-4',
            },
            {
              control: {
                ...getDropdownConfig('noticeAudienceTypeId', NOTICE.NOTICE_AUDIANCE_TYPE, this.noticeAudienceType),
                selectionChange: (data: ITextValueOption) => {
                  data && this.renderDropdown(data.value as string)
                },
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-12 col-md-4',
            },

            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-sm-6 col-lg-6 col-xl-4',
            }
          ],
        },
      ],
    };
  }

  protected override patchForm(noticeType: INoticeAudienceGroup): void {
    if (this.isSetValue()) return;
    this.formGroup.patchValue({
      ...noticeType,
      noticeGroupId: CommonHelper.resolveId(noticeType.noticeGroupId)
    });
    setTimeout(() => {

      this.formGroup.get('noticeAudienceTypeId').disable();
      this.formGroup.updateValueAndValidity()
    }, 0);
    this.isSetValue.set(true);
    const selectedOptions: ITextValueOption[] = Object.entries(noticeType.refIdsName).map(([key, value]) => ({
      value: value,
      text: key,
    }));
    this.renderDropdown(noticeType.noticeAudienceTypeId, noticeType.refIds, selectedOptions);
  }

  protected override submitForm(): void {
    this.store.create({
      endpoint: API.ADMIN.COMMUNICATION.NOTICE_AUDIANCE_GROUP.ADDUPDATE,
      body: this.formGroup.getRawValue() as any,
    });
  }

  protected override cancelRoute(): string[] {
    return [this.authStore.roleRoutePath(), 'communication', 'notice-audience-groups'];
  }

  private renderDropdown(selectedId: string, preselectedRefIds?: string[], selectedOptions?: ITextValueOption[]) {
    this.currentConfig.set(MapAPIByKey[selectedId] as IMapAPIByKeyForNotice);

    if (!this.currentConfig()?.isApiLoad) {
      this.removeExistingDropdown();
      this.formGroup.controls['refIds']?.clearValidators();
      this.formGroup.controls['refIds']?.updateValueAndValidity();
      return;
    }
    this.formGroup.controls['refIds']?.addValidators(Validators.required);
    this.formGroup.controls['refIds']?.updateValueAndValidity()

    this.genericDropdownStore.resetState();
    const columns = [{
      name: 'audienceTypeId',
      filterSearch: {
        value: selectedId.toString(),
        condition: 0
      }
    }];
    const dropdownConfig = {
      control: {
        ...getDropdownConfigWithLazyLoading(
          'refIds',
          this.currentConfig().label,
          selectedId,
          this.genericDropdownStore,
          API.ADMIN.COMMUNICATION.NOTICE_AUDIANCE_GROUP.DROPDOWN,
          columns,
          selectedOptions,
          null,
          {
            allowMultiple: true,
            enableLazyLoading: true,
            loadDataFromApi: true,
            allowSearching: false,
          }
        ),
        isFloatLabel: false,
      },
      type: DynamicFormControlType.DropDown,
      class: 'col-sm-6 col-lg-4 col-xl-4'
    };

    this.removeExistingDropdown();
    this.formControls.formSection[0].controls.splice(2, 0, dropdownConfig);
    this.formControls = { ...this.formControls };
    this.cdr.detectChanges();

    if (selectedOptions && selectedOptions.length > 0) {
      // const ids = selectedOptions.
      this.formGroup.get('refIds').setValue(preselectedRefIds, { emitEvent: false });
      setTimeout(() => {
      }, 10000);
    }
  }

  private removeExistingDropdown = () => {
    const index = this.formControls?.formSection?.at(0).controls?.findIndex(item => item.control["id"] == "refIdsId");

    if (index && index !== -1) {
      this.formControls.formSection[0].controls.splice(index, 1);
      this.formControls = { ...this.formControls };
      this.formGroup.get('refIds').setValue(undefined, { emitEvent: false });
      this.formGroup.updateValueAndValidity();
      this.cdr.detectChanges();
    }
  }

}
