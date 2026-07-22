import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { CLASS_ROUTE } from '../../../../../shared/constants/route.constant';
import { API } from '../../../../../shared/constants/api-url';
import { getDropdownConfig, getSlideToggleConfig, getButtonConfig } from '../../../../../shared/functions/config-function';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { SubjectAllocationStore } from '../stores/subject-allocation.store';
import { ClassStore } from '../../../configuration/class-page/stores/class.store';
import { SubjectStore } from '../../../configuration/subject/stores/subject.store';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { TITLES } from '../../../../../shared/constants/title.constant';

@Component({
  selector: 'app-subject-allocation-form',
  imports: [ReactiveFormsModule, DynamicFormComponent, ButtonComponent],
  templateUrl: './subject-allocation-form.html',
  styleUrl: './subject-allocation-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubjectAllocationForm implements OnInit {
  private readonly commonService = inject(CommonHelperService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly classStore = inject(ClassStore);
  private readonly subjectStore = inject(SubjectStore);
  private readonly subjectAllocationStore = inject(SubjectAllocationStore);
  permission = computed(() => this.commonService.getPermissionByPage());

  readonly isEditMode = signal(false);
  readonly classSubjectId = signal<string | null>(null);
  readonly isSaveClicked = signal(false);
  classOptions: ITextValueOption[] = [];
  subjectOptions: ITextValueOption[] = [];

  readonly form = this.fb.group({
    classId: [null as string | null, [Validators.required]],
    subjectId: [null as string | null, [Validators.required]],
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
    this.setFormControls(this.classOptions, this.subjectOptions);
    this.loadDropdownData();
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
      const classRows = this.classStore.list();
      const options = classRows.map((item: any) => ({
        text: item.className,
        value: item.classId,
      }));
      this.classOptions = options;
      this.setFormControls(this.classOptions, this.subjectOptions);
    });

    effect(() => {
      const subjectRows = this.subjectStore.list();
      const options = subjectRows.map((item: any) => ({
        text: item.subjectName,
        value: item.subjectId,
      }));
      this.subjectOptions = options;
      this.setFormControls(this.classOptions, this.subjectOptions);
    });

    effect(() => {
      if (!this.isEditMode()) return;
      const data = this.subjectAllocationStore.data();
      if (!data) return;
      this.form.patchValue({
        classId: data.classId,
        subjectId: data.subjectId,
        isActive: data.isActive,
      });
    });

    effect(() => {
      if (!this.isSaveClicked() || !this.subjectAllocationStore.isSuccess()) return;
      this.isSaveClicked.set(false);
      this.navigateToList();
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (!CommonHelper.isEmpty(id)) {
      this.classSubjectId.set(id);
      this.isEditMode.set(true);
      this.loadById(id!);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      classSubjectId: CommonHelper.resolveId(this.classSubjectId()),
      classId: this.form.get('classId')?.value ?? null,
      subjectId: this.form.get('subjectId')?.value ?? null,
      isActive: this.form.get('isActive')?.value ?? true,
    };

    this.isSaveClicked.set(true);
    this.subjectAllocationStore.create({
      endpoint: API.CLASS.ADD_UPDATE_CLASS_SUBJECT,
      body: payload as any,
    });
  }

  private loadDropdownData(): void {
    this.classStore.getAll({
      endpoint: API.CLASS.GET_CLASS_LIST,
      body: { pageIndex: 0, pageSize: -1, defaultSortingColumn: '', sortOrder: 'asc', generalSearch: '' },
    });
    this.subjectStore.getAll({
      endpoint: API.CLASS.GET_SUBJECT_LIST,
      body: { pageIndex: 0, pageSize: -1, defaultSortingColumn: '', sortOrder: 'asc', generalSearch: '' },
    });
  }

  private loadById(classSubjectId: string): void {
    this.subjectAllocationStore.getById({
      endpoint: API.CLASS.GET_CLASS_SUBJECT_BY_ID,
      params: { classSubjectId },
    });
  }

  private navigateToList(): void {
    this.router.navigate(['/admin/class', CLASS_ROUTE.SUBJECT_ALLOCATION]);
  }

  private setFormControls(classOptions: ITextValueOption[], subjectOptions: ITextValueOption[]): void {
    this.formControls = {
      formSection: [
        {
          controls: [
            {
              control: getDropdownConfig('classId', SYSTEM_CONST.LABELS.ACADEMIC.CLASS, classOptions, { allowSearching: true, allowClear: true }),
              type: DynamicFormControlType.DropDown,
              class: 'col-6',
            },
            {
              control: getDropdownConfig('subjectId', SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT, subjectOptions, {
                allowSearching: true,
                allowClear: true,
              }),
              type: DynamicFormControlType.DropDown,
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
}
