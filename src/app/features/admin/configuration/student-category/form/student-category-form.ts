import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getButtonConfig, getSlideToggleConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { studentCategoryStore, StudentCategory, STUDENT_CATEGORY_CONST } from '../models/student-category.model';
import { API } from '../../../../../shared/constants/api-url';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { FormUtils } from '../../../../../core/helpers/form-utils';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';

@Component({
  selector: 'app-student-category-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, MatButtonModule, ButtonComponent],
  providers: [studentCategoryStore],
  templateUrl: './student-category-form.html',
})
export class StudentCategoryForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly commonHelperService = inject(CommonHelperService);
  readonly studentCategoryStore = inject(studentCategoryStore);

  private readonly editCategoryId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.editCategoryId() !== null);
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
    categoryId: this.fb.control<string | null>(EMPTY_GUID),
    categoryName: this.fb.control('', [Validators.required, FormUtils.onlyString]),
    categoryCode: this.fb.control('', Validators.required),
    isActive: this.fb.control(true),
  });

  formControls!: DynamicForm;

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
      if (this.isSaveClicked() && this.studentCategoryStore.isSuccess()) {
        this.onCancel();
      }
    });

    effect(() => {
      if (!this.isEditMode()) return;
      const studentCategoryData = this.studentCategoryStore.data();
      if (!studentCategoryData) return;
      this.patchForm(studentCategoryData);
    });
  }

  ngOnInit(): void {
    this.studentCategoryStore.resetState();
    this.resolveEditMode();

    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: getTextboxConfig(STUDENT_CATEGORY_CONST.CATEGORY_NAME, 'categoryName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
            },
            {
              control: getTextboxConfig(STUDENT_CATEGORY_CONST.CATEGORY_CODE, 'categoryCode', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-12 col-md-6',
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
    this.studentCategoryStore.create({
      endpoint: API.ADMIN.CONFIGURATION.STUDENT_CATEGORY.ADDUPDATE,
      body: this.formGroup.getRawValue(),
    });
  };

  onCancel = (): void => {
    this.router.navigate(['admin', 'configuration', 'student-categories']);
  };

  private resolveEditMode = (): void => {
    const categoryIdParam = this.route.snapshot.paramMap.get('categoryId');
    if (CommonHelper.isEmpty(categoryIdParam)) return;

    this.editCategoryId.set(categoryIdParam);

    this.studentCategoryStore.getById({
      endpoint: API.ADMIN.CONFIGURATION.STUDENT_CATEGORY.GET,
      params: { categoryId: categoryIdParam },
    });
  };

  private patchForm = (studentCategory: StudentCategory): void => {
    this.formGroup.patchValue({
      categoryId: CommonHelper.resolveId(studentCategory.categoryId),
      categoryName: studentCategory.categoryName ?? '',
      categoryCode: studentCategory.categoryCode ?? '',
      isActive: studentCategory.isActive ?? true,
    });
  };
}

