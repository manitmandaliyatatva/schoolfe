import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { getButtonConfig, getDropdownConfig, getSlideToggleConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { classSubjectStore, ClassSubject } from '../models/class-subject.model';
import { API } from '../../../../../shared/constants/api-url';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { ClassStore } from '../../class-page/stores/class.store';
import { SubjectStore } from '../../subject/stores/subject.store';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';

@Component({
  selector: 'app-class-subject-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, ButtonComponent],
  providers: [classSubjectStore],
  templateUrl: './class-subject-form.html',
})
export class ClassSubjectForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly classStore = inject(ClassStore);
  private readonly subjectStore = inject(SubjectStore);
  readonly classSubjectStore = inject(classSubjectStore);
  permission = computed(() => this.commonHelperService.getPermissionByPage());

  private readonly editClassSubjectId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.editClassSubjectId() !== null);
  readonly isSaveClicked = signal<boolean>(false);

  classOptions: ITextValueOption[] = [];
  subjectOptions: ITextValueOption[] = [];
  saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onSave(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.SAVE, true),
    cssClasses: ['btn', 'primary-btn'],
  });
  cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false),
    cssClasses: ['btn', 'secondary-btn'],
  });

  formGroup = this.fb.nonNullable.group({
    classSubjectId: this.fb.control<string | null>(EMPTY_GUID),
    classId: this.fb.control<string | null>(null, Validators.required),
    subjectId: this.fb.control<string | null>(null, Validators.required),
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
      if (this.isSaveClicked() && this.classSubjectStore.isSuccess()) {
        this.onCancel();
      }
    });

    effect(() => {
      if (!this.isEditMode()) return;
      const classSubjectData = this.classSubjectStore.data();
      if (!classSubjectData) return;
      this.patchForm(classSubjectData);
    });

    effect(() => {
      const classRows = this.classStore.list();
      this.classOptions = classRows.map((row: any) => ({
        text: row.className,
        value: row.classId,
      }));
      this.buildFormControls();
    });

    effect(() => {
      const subjectRows = this.subjectStore.list();
      this.subjectOptions = subjectRows.map((row: any) => ({
        text: row.subjectName,
        value: row.subjectId,
      }));
      this.buildFormControls();
    });
  }

  ngOnInit(): void {
    this.classSubjectStore.resetState();
    this.resolveEditMode();
    this.loadDropdownData();
    this.buildFormControls();
  }

  onSave = (): void => {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.isSaveClicked.set(true);
    this.classSubjectStore.create({
      endpoint: API.ADMIN.CONFIGURATION.CLASS_SUBJECT.ADDUPDATE,
      body: this.formGroup.getRawValue() as ClassSubject,
    });
  };

  onCancel = (): void => {
    this.router.navigate(['admin', 'configuration', 'class-subjects']);
  };

  private resolveEditMode = (): void => {
    const classSubjectIdParam = this.route.snapshot.paramMap.get('classSubjectId');
    if (CommonHelper.isEmpty(classSubjectIdParam)) return;

    this.editClassSubjectId.set(classSubjectIdParam);

    this.classSubjectStore.getById({
      endpoint: API.ADMIN.CONFIGURATION.CLASS_SUBJECT.GET,
      params: { classSubjectId: classSubjectIdParam },
    });
  };

  private patchForm = (classSubject: ClassSubject): void => {
    this.formGroup.patchValue({
      classSubjectId: CommonHelper.resolveId(classSubject.classSubjectId),
      classId: CommonHelper.resolveId(classSubject.classId),
      subjectId: CommonHelper.resolveId(classSubject.subjectId),
      isActive: classSubject.isActive ?? true,
    });
  };

  private loadDropdownData = (): void => {
    this.classStore.getAll({
      endpoint: API.CLASS.GET_CLASS_LIST,
      body: { pageIndex: 0, pageSize: -1, defaultSortingColumn: '', sortOrder: 'asc', generalSearch: '' },
    });

    this.subjectStore.getAll({
      endpoint: API.CLASS.GET_SUBJECT_LIST,
      body: { pageIndex: 0, pageSize: -1, defaultSortingColumn: '', sortOrder: 'asc', generalSearch: '' },
    });
  };

  private buildFormControls = (): void => {
    this.formControls = {
      formSection: [
        {
          title: SYSTEM_CONST.SECTIONS.BASIC_INFORMATION,
          controls: [
            {
              control: {
                ...getDropdownConfig('classId', SYSTEM_CONST.LABELS.ACADEMIC.CLASS, this.classOptions),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
            {
              control: {
                ...getDropdownConfig('subjectId', SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT, this.subjectOptions),
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
}
