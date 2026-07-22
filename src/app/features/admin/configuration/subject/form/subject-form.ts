import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { API } from '../../../../../shared/constants/api-url';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getTextboxConfig, getSlideToggleConfig, getButtonConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { SubjectStore } from '../stores/subject.store';
import { ADMIN_ROUTE } from '../../../../../shared/constants/route.constant';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { SUBJECT_CONST } from '../models/subject.model';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';

@Component({
  selector: 'app-subject-form',
  imports: [ReactiveFormsModule, DynamicFormComponent, ButtonComponent],
  templateUrl: './subject-form.html',
  styleUrl: './subject-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubjectForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly subjectStore = inject(SubjectStore);
  private readonly commonHelperService = inject(CommonHelperService);

  readonly isEditMode = signal(false);
  readonly subjectId = signal<string | null>(null);
  readonly isSaveClicked = signal(false);
  permission = computed(() => this.commonHelperService.getPermissionByPage());
  readonly form = this.fb.group({
    subjectId: [EMPTY_GUID],
    subjectName: ['', [Validators.required]],
    subjectCode: ['', [Validators.required]],
    isActive: [true, [Validators.required]],
  });
  formControls!: DynamicForm;

  readonly saveButtonConfig = signal<CommonButtonConfig>(
    getButtonConfig(
      () => this.onSubmit(),
      'flat',
      'primary',
      SYSTEM_CONST.ACTION_BUTTONS.SAVE,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ['btn', 'primary-btn']
    )
  );
  readonly cancelButtonConfig = signal<CommonButtonConfig>(
    getButtonConfig(
      () => this.navigateToList(),
      'stroked',
      'basic',
      SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      ['btn', 'secondary-btn']
    )
  );

  ngOnInit(): void {
    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: getTextboxConfig(SUBJECT_CONST.SUBJECT_NAME, 'subjectName', undefined, InputType.text, 'outline'),
              type: DynamicFormControlType.Text,
              class: 'col-6',
            },
            {
              control: getTextboxConfig(SUBJECT_CONST.SUBJECT_CODE, 'subjectCode', undefined, InputType.text, 'outline'),
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

  constructor() {
    effect(() => {
      const p = this.permission();
      if (this.isEditMode()) {
        if (!p.canView && !p.canUpdate) this.navigateToList();
        if (!p.canUpdate) this.form.disable();
      } else {
        if (!p.canCreate) this.navigateToList();
      }
    });
    effect(() => {
      if (!this.isSaveClicked() || !this.subjectStore.isSuccess()) return;
      this.isSaveClicked.set(false);
      this.navigateToList();
    });

    effect(() => {
      if (!this.isEditMode()) return;
      const data = this.subjectStore.data();
      if (!data) return;
      this.form.patchValue({
        ...data,
        subjectId: CommonHelper.resolveId(data.subjectId),
      });
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!CommonHelper.isEmpty(id)) {
      this.subjectId.set(id);
      this.isEditMode.set(true);
      this.loadSubject(id!);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.form.value,
      subjectId: CommonHelper.resolveId(this.form.value.subjectId),
    };

    this.isSaveClicked.set(true);
    this.subjectStore.create({
      endpoint: API.CLASS.ADD_UPDATE_SUBJECT,
      body: payload as any,
    });
  }

  private loadSubject(subjectId: string): void {
    this.subjectStore.getById({
      endpoint: API.CLASS.GET_SUBJECT_BY_ID,
      params: { subjectId },
    });
  }

  private navigateToList(): void {
    this.router.navigateByUrl(`admin/configuration/${ADMIN_ROUTE.CONFIGURATION.SUBJECT}`);
  }
}
