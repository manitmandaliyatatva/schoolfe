import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import CommonHelper from "../../../../../core/helpers/common-helper";
import { FormUtils } from "../../../../../core/helpers/form-utils";
import { CommonHelperService } from "../../../../../core/services/common-helper.service";
import { ButtonComponent } from "../../../../../shared/components/button/button.component";
import { CommonButtonConfig } from "../../../../../shared/components/button/model/button.model";
import { DynamicFormComponent } from "../../../../../shared/components/dynamic-form/dynamic-form.component";
import { DynamicForm } from "../../../../../shared/components/dynamic-form/model/dynamic-form.model";
import { API } from "../../../../../shared/constants/api-url";
import { EMPTY_GUID } from "../../../../../shared/constants/app.constants";
import { InputType } from "../../../../../shared/Enums/common.enum";
import { getButtonConfig, getSlideToggleConfig, getTextboxConfig } from "../../../../../shared/functions/config-function";
import { DynamicFormControlType } from "../../../../../shared/models/form-control-base.model";
import { INoticeAudianceType, NOTICE_AUDIANCE_TYPE, noticeAudianceTypeStore } from "../model/notice-audiance-type.model";

@Component({
    selector: 'notice-type-form',
    imports: [ButtonComponent, DynamicFormComponent, ReactiveFormsModule, CommonModule],
    providers: [noticeAudianceTypeStore],
    templateUrl: "./notice-audience-type-form.html"
})
export class NoticeAudianceTypeForm implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly commonHelperService = inject(CommonHelperService);
    readonly _noticeAudianceTypeStore = inject(noticeAudianceTypeStore);

    private readonly editNoticeTypeId = signal<string | null>(null);
    readonly isEditMode = computed(() => this.editNoticeTypeId() !== null);
    readonly isSaveClicked = signal<boolean>(false);

    permission = computed(() => this.commonHelperService.getPermissionByPage());
    saveBtn = signal<CommonButtonConfig>({
        ...getButtonConfig(() => this.onSave(), 'flat', 'primary', NOTICE_AUDIANCE_TYPE.SAVE, true),
        cssClasses: ['btn', 'primary-btn'],
    });
    cancelBtn = signal<CommonButtonConfig>({
        ...getButtonConfig(() => this.onCancel(), 'stroked', 'basic', NOTICE_AUDIANCE_TYPE.CANCEL, false),
        cssClasses: ['btn', 'secondary-btn'],
    });

    formGroup = this.fb.nonNullable.group({
        noticeAudienceTypeId: this.fb.control<string | null>(EMPTY_GUID),
        name: this.fb.control('', [Validators.required, FormUtils.onlyString]),
        description: this.fb.control('', Validators.required),
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
            if (this.isSaveClicked() && this._noticeAudianceTypeStore.isSuccess()) {
                this.onCancel();
            }
        });

        effect(() => {
            if (!this.isEditMode()) return;
            const roleData = this._noticeAudianceTypeStore.data();
            if (!roleData) return;
            this.patchForm(roleData);
        });
    }

    ngOnInit(): void {
        this._noticeAudianceTypeStore.resetState();
        this.resolveEditMode();

        this.formControls = {
            formSection: [
                {
                    title: NOTICE_AUDIANCE_TYPE.BASIC_INFORMATION,
                    controls: [
                        {
                            control: getTextboxConfig(NOTICE_AUDIANCE_TYPE.NOTICE_AUDIANCE_TYPE_NAME, 'name', undefined, InputType.text, 'outline'),
                            type: DynamicFormControlType.Text,
                            class: 'col-12 col-md-6',
                        },
                        {
                            control: getTextboxConfig(NOTICE_AUDIANCE_TYPE.NOTICE_AUDIANCE_TYPE_DESCRIPTION, 'description', undefined, InputType.textarea, 'outline'),
                            type: DynamicFormControlType.TextArea,
                            class: 'col-12 col-md-6',
                        },
                        {
                            control: getSlideToggleConfig('isActive', NOTICE_AUDIANCE_TYPE.IS_ACTIVE),
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
        this._noticeAudianceTypeStore.create({
            endpoint: API.ADMIN.COMMUNICATION.ADD_NOTICE_AUDIANCE_TYPE,
            body: this.formGroup.getRawValue() as INoticeAudianceType,
        });
    };

    onCancel = (): void => {
        this.router.navigate(['admin', 'communication', 'notice-audience-types']);
    };

    private resolveEditMode = (): void => {
        const noticeTypeId = this.route.snapshot.paramMap.get('id');
        if (CommonHelper.isEmpty(noticeTypeId)) return;

        this.editNoticeTypeId.set(noticeTypeId);

        this._noticeAudianceTypeStore.getById({
            endpoint: API.ADMIN.COMMUNICATION.NOTICE_AUDIANCE_TYPE_BYID,
            params: { noticeAudienceTypeId: noticeTypeId },
        });
    };

    private patchForm = (noticeType: INoticeAudianceType): void => {
        this.formGroup.patchValue({
            noticeAudienceTypeId: CommonHelper.resolveId(noticeType.noticeAudienceTypeId),
            name: noticeType.name ?? '',
            description: noticeType.description ?? null,
            isActive: noticeType.isActive ?? true,
        });
    };
}