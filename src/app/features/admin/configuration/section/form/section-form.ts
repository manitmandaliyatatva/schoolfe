import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ButtonComponent } from "../../../../../shared/components/button/button.component";
import { DynamicFormComponent } from "../../../../../shared/components/dynamic-form/dynamic-form.component";
import { DynamicForm } from "../../../../../shared/components/dynamic-form/model/dynamic-form.model";
import { API } from "../../../../../shared/constants/api-url";
import { InputType } from "../../../../../shared/Enums/common.enum";
import { getSlideToggleConfig, getTextboxConfig } from "../../../../../shared/functions/config-function";
import { DynamicFormControlType } from "../../../../../shared/models/form-control-base.model";
import { SectionStore } from "../stores/section.store";
import { ADMIN_ROUTE } from "../../../../../shared/constants/route.constant";
import { SYSTEM_CONST } from "../../../../../core/constants/system.constant";
import { TITLES } from "../../../../../shared/constants/title.constant";
import { SECTION_CONST, SectionGridRow } from "../models/section.model";
import { BaseFormComponent } from "../../../../../shared/components/form-base/form-base";
import { EMPTY_GUID } from "../../../../../shared/constants/app.constants";
import CommonHelper from "../../../../../core/helpers/common-helper";

@Component({
  selector: 'app-section-form',
  imports: [ReactiveFormsModule, DynamicFormComponent, ButtonComponent],
  templateUrl: './section-form.html',
  styleUrl: './section-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionForm extends BaseFormComponent<SectionGridRow> {
  private readonly fb = inject(FormBuilder);

  protected override readonly store = inject(SectionStore);
  protected override getByIdEndpoint = API.CLASS.GET_SECTION_BY_ID;
  protected override entityIdParamKey = 'id';

  protected override readonly formGroup = this.fb.group({
    sectionID: [EMPTY_GUID],
    sectionName: ['', [Validators.required]],
    sectionCode: ['', [Validators.required]],
    isActive: [true, [Validators.required]],
  });

  protected override formControls!: DynamicForm;

  constructor() {
    super();
    this.store.resetState();
  }

  protected override buildFormControls(): void {
    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: getTextboxConfig(SECTION_CONST.SECTION_NAME, 'sectionName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: getTextboxConfig(SECTION_CONST.SECTION_CODE, 'sectionCode', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: getSlideToggleConfig('isActive', SYSTEM_CONST.LABELS.COMMON.IS_ACTIVE, 'after', 'primary'),
              type: DynamicFormControlType.SlideToggle,
              class: 'col-12',
            },
          ],
        },
      ],
    };
  }

  protected override loadData(): void {
    if (this.isEditMode()) {
      this.store.getById({
        endpoint: this.getByIdEndpoint,
        params: { sectionId: this.editId() },
      });
    }
  }

  protected override patchForm(data: SectionGridRow): void {
    this.formGroup.patchValue({
      ...data,
      sectionID: CommonHelper.resolveId(data.sectionID),
    });
  }

  protected override submitForm(): void {
    const payload = { ...this.formGroup.value };

    this.store.create({
      endpoint: API.CLASS.ADD_UPDATE_SECTION,
      body: payload as any,
    });
  }

  protected override cancelRoute(): string[] {
    return ['/admin/configuration', ADMIN_ROUTE.CONFIGURATION.SECTION];
  }
}
