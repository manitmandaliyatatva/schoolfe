import { Component, computed, effect, inject, OnInit, signal } from "@angular/core";
import CommonHelper from "../../../../../core/helpers/common-helper";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { CommonHelperService } from "../../../../../core/services/common-helper.service";
import { CommonButtonConfig } from "../../../../../shared/components/button/model/button.model";
import { DynamicForm } from "../../../../../shared/components/dynamic-form/model/dynamic-form.model";
import { API } from "../../../../../shared/constants/api-url";
import { TITLES } from "../../../../../shared/constants/title.constant";
import { InputType } from "../../../../../shared/Enums/common.enum";
import { getButtonConfig, getTextboxConfig, getSlideToggleConfig } from "../../../../../shared/functions/config-function";
import { DynamicFormControlType } from "../../../../../shared/models/form-control-base.model";
import { INoticeType, NOTICE_TYPE, noticeTypeStore } from "../model/notice-type.model";
import { ButtonComponent } from "../../../../../shared/components/button/button.component";
import { DynamicFormComponent } from "../../../../../shared/components/dynamic-form/dynamic-form.component";
import { CommonModule } from "@angular/common";
import { SYSTEM_CONST } from "../../../../../core/constants/system.constant";
import { EMPTY_GUID } from "../../../../../shared/constants/app.constants";

@Component({
    selector: 'notice-type-form',
    imports: [ButtonComponent, DynamicFormComponent, ReactiveFormsModule, CommonModule],
    providers: [noticeTypeStore],
    templateUrl: "./notice-type-form.html"
})
export class NoticeTypeForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly commonHelperService = inject(CommonHelperService);
    readonly _noticeTypeStore = inject(noticeTypeStore);

    private readonly editNoticeTypeId = signal<string | null>(null);
    readonly isEditMode = computed(() => this.editNoticeTypeId() !== null);
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
        noticeTypeId: this.fb.control<string | null>(EMPTY_GUID),
        noticeTypeName: this.fb.control('', Validators.required),
        noticeTypeCode: this.fb.control('', Validators.required),
        allowAdmin: this.fb.control(true),
        allowTeacher: this.fb.control(true),
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
            if (this.isSaveClicked() && this._noticeTypeStore.isSuccess()) {
                this.onCancel();
            }
        });

        effect(() => {
            if (!this.isEditMode()) return;
            const roleData = this._noticeTypeStore.data();
            if (!roleData) return;
            this.patchForm(roleData);
        });
    }

    ngOnInit(): void {
        this._noticeTypeStore.resetState();
        this.resolveEditMode();

        this.formControls = {
            formSection: [
                {
                    title: NOTICE_TYPE.BASIC_INFORMATION,
                    controls: [
                        {
                            control: getTextboxConfig(NOTICE_TYPE.NOTICE_TYPE_NAME, 'noticeTypeName', undefined, InputType.text, 'outline'),
                            type: DynamicFormControlType.Text,
                            class: 'col-12 col-md-6',
                        },
                        {
                            control: getTextboxConfig(NOTICE_TYPE.NOTICE_TYPE_CODE, 'noticeTypeCode', undefined, InputType.text, 'outline'),
                            type: DynamicFormControlType.Text,
                            class: 'col-12 col-md-6',
                        },
                        {
                            control: getSlideToggleConfig('allowAdmin', NOTICE_TYPE.ALLOW_ADMIN),
                            type: DynamicFormControlType.SlideToggle,
                            class: 'col-sm-6 col-lg-6 col-xl-6',
                        },
                        {
                            control: getSlideToggleConfig('allowTeacher', NOTICE_TYPE.ALLOW_TEACHER),
                            type: DynamicFormControlType.SlideToggle,
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
        this._noticeTypeStore.create({
            endpoint: API.ADMIN.COMMUNICATION.NOTICE_TYPE.ADDUPDATE,
            body: this.formGroup.getRawValue() as INoticeType,
        });
    };

    onCancel = (): void => {
        this.router.navigate(['admin', 'communication', 'notice-types']);
    };

    private resolveEditMode = (): void => {
        const noticeTypeId = this.route.snapshot.paramMap.get('id');
        if (CommonHelper.isEmpty(noticeTypeId)) return;

        this.editNoticeTypeId.set(noticeTypeId);

        this._noticeTypeStore.getById({
            endpoint: API.ADMIN.COMMUNICATION.NOTICE_TYPE.GET,
            params: { noticeTypeId: noticeTypeId },
        });
    };

    private patchForm = (noticeType: INoticeType): void => {
        this.formGroup.patchValue({
            noticeTypeId: noticeType.noticeTypeId,
            noticeTypeName: noticeType.noticeTypeName ?? '',
            noticeTypeCode: noticeType.noticeTypeCode ?? null,
            isActive: noticeType.isActive ?? true,
            allowAdmin: noticeType.allowAdmin ?? true,
            allowTeacher: noticeType.allowTeacher ?? true,
        });
    };
}