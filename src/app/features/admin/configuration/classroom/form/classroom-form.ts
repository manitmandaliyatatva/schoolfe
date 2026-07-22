import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InputType } from '../../../../../shared/Enums/common.enum';
import { getButtonConfig, getDropdownConfig, getSlideToggleConfig, getTextboxConfig } from '../../../../../shared/functions/config-function';
import { DynamicFormComponent } from '../../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicForm } from '../../../../../shared/components/dynamic-form/model/dynamic-form.model';
import { DynamicFormControlType } from '../../../../../shared/models/form-control-base.model';
import { classroomStore, Classroom, CLASSROOM_CONST } from '../models/classroom.model';
import { API } from '../../../../../shared/constants/api-url';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { ClassStore } from '../../class-page/stores/class.store';
import { SectionStore } from '../../section/stores/section.store';
import { ITextValueOption } from '../../../../../shared/models/common.model';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { EMPTY_GUID } from '../../../../../shared/constants/app.constants';

@Component({
  selector: 'app-classroom-form',
  imports: [DynamicFormComponent, ReactiveFormsModule, ButtonComponent],
  providers: [classroomStore],
  templateUrl: './classroom-form.html',
})
export class ClassroomForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly classStore = inject(ClassStore);
  private readonly sectionStore = inject(SectionStore);
  readonly classroomStore = inject(classroomStore);

  private readonly editClassroomId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.editClassroomId() !== null);
  readonly isSaveClicked = signal<boolean>(false);
  permission = computed(() => this.commonHelperService.getPermissionByPage());

  classOptions: ITextValueOption[] = [];
  sectionOptions: ITextValueOption[] = [];
  saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onSave(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.SAVE, true),
    cssClasses: ['btn', 'primary-btn'],
  });
  cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false),
    cssClasses: ['btn', 'secondary-btn'],
  });

  formGroup = this.fb.nonNullable.group({
    classSectionId: this.fb.control<string | null>(EMPTY_GUID),
    classId: this.fb.control<string | null>(null, Validators.required),
    sectionId: this.fb.control<string | null>(null, Validators.required),
    roomNo: this.fb.control<number | null>(null, Validators.required),
    roomCapacity: this.fb.control<number | null>(null, Validators.required),
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
      if (this.isSaveClicked() && this.classroomStore.isSuccess()) {
        this.onCancel();
      }
    });

    effect(() => {
      if (!this.isEditMode()) return;
      const classroomData = this.classroomStore.data();
      if (!classroomData) return;
      this.patchForm(classroomData);
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
      const sectionRows = this.sectionStore.list();
      this.sectionOptions = sectionRows.map((row: any) => ({
        text: row.sectionName,
        value: row.sectionID,
      }));
      this.buildFormControls();
    });
  }

  ngOnInit(): void {
    this.classroomStore.resetState();
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
    this.classroomStore.create({
      endpoint: API.ADMIN.CONFIGURATION.CLASSROOM.ADDUPDATE,
      body: this.formGroup.getRawValue() as Classroom,
    });
  };

  onCancel = (): void => {
    this.router.navigate(['admin', 'configuration', 'classrooms']);
  };

  private resolveEditMode = (): void => {
    const classroomIdParam = this.route.snapshot.paramMap.get('classSectionId');
    if (CommonHelper.isEmpty(classroomIdParam)) return;

    this.editClassroomId.set(classroomIdParam);

    this.classroomStore.getById({
      endpoint: API.ADMIN.CONFIGURATION.CLASSROOM.GET,
      params: { classSectionId: classroomIdParam },
    });
  };

  private patchForm = (classroom: Classroom): void => {
    this.formGroup.patchValue({
      classSectionId: CommonHelper.resolveId(classroom.classSectionId),
      classId: CommonHelper.resolveId(classroom.classId),
      sectionId: CommonHelper.resolveId(classroom.sectionId),
      roomNo: classroom.roomNo ?? null,
      roomCapacity: classroom.roomCapacity ?? null,
      isActive: classroom.isActive ?? true,
    });
  };

  private loadDropdownData = (): void => {
    this.classStore.getAll({
      endpoint: API.CLASS.GET_CLASS_LIST,
      body: { pageIndex: 0, pageSize: -1, defaultSortingColumn: '', sortOrder: 'asc', generalSearch: '' },
    });

    this.sectionStore.getAll({
      endpoint: API.CLASS.GET_SECTION_LIST,
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
                ...getDropdownConfig('sectionId', CLASSROOM_CONST.SECTION_NAME, this.sectionOptions),
                isFloatLabel: false,
              },
              type: DynamicFormControlType.DropDown,
              class: 'col-sm-6 col-lg-6 col-xl-6',
            },
            {
              control: {
                ...getTextboxConfig(CLASSROOM_CONST.ROOM_NO, 'roomNo', undefined, InputType.number, 'outline'),
                allowFloatValues: false
              },
              type: DynamicFormControlType.Number,
              class: 'col-12 col-md-6',
            },
            {
              control: {
                ...getTextboxConfig(CLASSROOM_CONST.ROOM_CAPACITY, 'roomCapacity', undefined, InputType.number, 'outline'),
                allowFloatValues: false
              },
              type: DynamicFormControlType.Number,
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
}
