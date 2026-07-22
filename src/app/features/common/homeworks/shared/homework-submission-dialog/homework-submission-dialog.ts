import { Component, computed, effect, inject, Injector, OnDestroy, OnInit, signal } from "@angular/core";
import CommonHelper from "../../../../../core/helpers/common-helper";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { SYSTEM_CONST } from "../../../../../core/constants/system.constant";
import { CommonHelperService } from "../../../../../core/services/common-helper.service";
import { AuthStore } from "../../../../../core/store/auth.store";
import { ButtonComponent } from "../../../../../shared/components/button/button.component";
import { CommonButtonConfig } from "../../../../../shared/components/button/model/button.model";
import { DynamicFormComponent } from "../../../../../shared/components/dynamic-form/dynamic-form.component";
import { DynamicForm } from "../../../../../shared/components/dynamic-form/model/dynamic-form.model";
import { GenericDialog } from "../../../../../shared/components/generic-dialog/generic-dialog";
import { API } from "../../../../../shared/constants/api-url";
import { TITLES } from "../../../../../shared/constants/title.constant";
import { InputType } from "../../../../../shared/Enums/common.enum";
import { getButtonConfig, getDocumentUploadConfig, getTextboxConfig } from "../../../../../shared/functions/config-function";
import { DynamicFormControlType } from "../../../../../shared/models/form-control-base.model";
import { base64DocumentStore } from "../../../../../shared/models/document.model";
import { HOMEWORK_CONST, HomeWorkStatus } from "../../homeworks/models/homework.model";
import { HomeworkStudent, homeworkStudentStore, HomeworkSubmissionDialogData } from "./homework-submission-dialog.model";
import { EMPTY_GUID } from "../../../../../shared/constants/app.constants";


@Component({
  selector: 'app-homework-submission-dialog',
  standalone: true,
  imports: [DynamicFormComponent, ReactiveFormsModule, ButtonComponent, MatDialogModule, MatIconModule],
  providers: [homeworkStudentStore, base64DocumentStore],
  templateUrl: './homework-submission-dialog.html',
  styleUrl: './homework-submission-dialog.scss',
})
export class HomeworkSubmissionDialog implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<GenericDialog, boolean>);
  private readonly injector = inject(Injector);
  private readonly authStore = inject(AuthStore);
  private readonly attachmentStore = inject(base64DocumentStore);
  protected readonly commonHelperService = inject(CommonHelperService);
  protected readonly store = inject(homeworkStudentStore);

  readonly dialogData = this.injector.get<HomeworkSubmissionDialogData | null>('DIALOG_DATA', null);

  protected readonly editId = signal<string | null>(null);
  protected readonly isEditMode = computed(() => !CommonHelper.isEmpty(this.editId()));
  protected readonly isSaveClicked = signal(false);
  protected readonly pageTitle = TITLES.STUDENT.HOMEWORKS;
  protected readonly homeworkConst = HOMEWORK_CONST;

  protected readonly permission = computed(() => {
    const perm = this.commonHelperService.getPermissionByPage();
    return {
      ...perm,
      canCreate: perm.canCreate || this.authStore.isStudent(),
      canUpdate: perm.canUpdate || this.authStore.isStudent(),
    };
  });

  protected readonly screenTitle = computed(() =>
    this.commonHelperService.handleFormTitle(this.pageTitle, this.isEditMode())
  );

  protected readonly saveBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(
      () => this.onSave(),
      'flat',
      'primary',
      HOMEWORK_CONST.SUBMISSION.SAVE_BUTTON,
      true
    ),
    cssClasses: ['btn', 'primary-btn'],
  });

  protected readonly cancelBtn = signal<CommonButtonConfig>({
    ...getButtonConfig(
      () => this.onCancel(),
      'stroked',
      'primary',
      SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
      false
    ),
    cssClasses: ['btn', 'secondary-btn'],
  });

  protected formGroup = this.fb.group({
    homeworkStudentId: [EMPTY_GUID],
    homeworkId: [null as string | null, [Validators.required]],
    status: [HomeWorkStatus.submitted],
    submissionDescription: ['', [Validators.required]],
    submissionAttachment: [null as string | null, [Validators.required]],
    submissionAttachmentFileName: [null as string | null],
  });

  protected formControls!: DynamicForm;

  constructor() {
    effect(() => {
      const p = this.permission();
      if (!p.canCreate && !p.canUpdate) {
        this.dialogRef.close(false);
      }
    });

    effect(() => {
      if (this.isSaveClicked() && this.store.isSuccess()) {
        this.dialogRef.close(true);
      }
    });

    effect(() => {
      if (!this.isEditMode()) return;
      const data = this.store.data();
      if (data) {
        this.patchForm(data);
      }
    });

  }

  ngOnInit(): void {
    this.store.resetState();
    this.buildFormControls();

    const hwId = this.dialogData?.homeworkId;
    const studentHwId = this.dialogData?.homeworkStudentId;
    const status = this.dialogData?.studentHomeworkStatus;

    if (!CommonHelper.isEmpty(hwId)) {
      this.formGroup.patchValue({ homeworkId: hwId });

      if ([String(HomeWorkStatus.submitted), String(HomeWorkStatus.needsCorrection), String(HomeWorkStatus.rejected)].includes(String(status))) {
        this.editId.set(hwId!);

        if (!CommonHelper.isEmpty(studentHwId)) {
          this.formGroup.patchValue({ homeworkStudentId: studentHwId });
        }

        this.store.getById({
          endpoint: API.STUDENT.HOMEWORK.GET_BY_HW_ID,
          params: { homeworkId: hwId }
        });
      }
    }
  }

  buildFormControls = (): void => {
    this.formControls = {
      formSection: [
        {
          controls: [
            {
              control: getTextboxConfig(
                HOMEWORK_CONST.SUBMISSION.DESCRIPTION,
                'submissionDescription',
                undefined,
                InputType.textarea,
                'outline'
              ),
              type: DynamicFormControlType.TextArea,
              class: 'col-12',
            },
            {
              control: getDocumentUploadConfig(
                'submissionAttachment',
                HOMEWORK_CONST.SUBMISSION.ATTACHMENT,
                ['.pdf'],
                false,
                this.isEditMode() ? SYSTEM_CONST.LABELS.FILE_UPLOAD.CHANGE_FILE : SYSTEM_CONST.LABELS.FILE_UPLOAD.UPLOAD_FILE,
                API.STUDENT.HOMEWORK.GET_ATTACHMENT_BASE64,
                'homeworkStudentId',
                'submissionAttachmentFileName'
              ),
              type: DynamicFormControlType.DocumentUpload,
              class: 'col-12',
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
    const payload = this.formGroup.getRawValue();
    this.store.create({
      endpoint: API.STUDENT.HOMEWORK.ADD_UPDATE,
      body: payload as any,
    });
  }

  patchForm = (data: HomeworkStudent): void => {
    this.formGroup.patchValue({
      ...data,
      homeworkStudentId: data.homeworkStudentId ?? EMPTY_GUID,
      submissionAttachment: data.submissionAttachment || null,
      status: HomeWorkStatus.submitted
    } as any);
  }

  onCancel = (): void => {
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.store.resetState();
    this.attachmentStore.resetState();
  }
}
