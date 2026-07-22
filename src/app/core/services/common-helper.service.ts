import { ElementRef, inject, Injectable, WritableSignal } from "@angular/core";
import { Router } from "@angular/router";
import { AuthStore } from "../store/auth.store";
import { ButtonType } from "../models/common.model";
import { EmailConfirmation, EMAIL_VALIDATION_CONST } from "../models/email-validation.model";
import { ConfirmationService } from "../../shared/services/dialog.service";
import { MenuPermissionStore } from "../store/menu-permission.store";
import { SYSTEM_CONST } from "../constants/system.constant";
import { animationFrameScheduler, Observable, of, EMPTY } from "rxjs";
import { switchMap } from "rxjs/operators";
import { REGEX_CONST } from "../constants/regex.constant";
import { GenericDialogService } from "../../shared/services/generic-dialog.service";
import { EmailConflictDialog } from "../../shared/components/email-conflict-dialog/email-conflict-dialog";
import { getButtonConfig } from "../../shared/functions/config-function";
import { GlobalRefreshService } from "./global-refresh.service";
import { PermissionRefreshService } from "./permission-refresh.service";

@Injectable({ providedIn: 'root' })
export class CommonHelperService {
    private authStore = inject(AuthStore);
    private router = inject(Router);

    private confirmService = inject(ConfirmationService);
    private genericDialogService = inject(GenericDialogService);
    private menuStore = inject(MenuPermissionStore);
    private globalRefreshService = inject(GlobalRefreshService);
    private permissionRefreshService = inject(PermissionRefreshService);

    redirectToDashboard = (): void => {
        const currentUrl = this.router.url.split('?')[0].split('#')[0];
        let targetDashboard = '/login';

        if (this.authStore.isAdmin()) {
            targetDashboard = '/admin/dashboard';
        } else if (this.authStore.isStudent()) {
            targetDashboard = '/student/dashboard';
        } else if (this.authStore.isTeacher()) {
            targetDashboard = '/teacher/dashboard';
        } else if (this.authStore.isParent()) {
            targetDashboard = '/parent/dashboard';
        }

        currentUrl === targetDashboard ?
            this.globalRefreshService.triggerGlobalRefresh()
            : this.router.navigate([targetDashboard]);
    }

    handlePostLogin = (token?: string): void => {
        const proceed = () => {
            // Load Permission
            this.permissionRefreshService.triggerRefreshPermission();
            this.redirectToDashboard();
        };

        if (token) {
            this.authStore.updateAccessTokens(token, proceed);
        } else {
            this.authStore.fetchUserContext(proceed);
        }
    }

    handleFormTitle = (screenTitle: string, isEditMode: boolean = false): string =>
        `${isEditMode ? 'Edit' : 'Add'} ${screenTitle}`;

    handleButtonText = (screenTitle: string, buttonType: ButtonType = ButtonType.Add): string => {
        switch (buttonType) {
            case ButtonType.Edit: return `${SYSTEM_CONST.ACTION_BUTTONS.EDIT} ${screenTitle}`;
            case ButtonType.View: return `${SYSTEM_CONST.ACTION_BUTTONS.VIEW} ${screenTitle}`;
            case ButtonType.Download: return `${SYSTEM_CONST.ACTION_BUTTONS.DOWNLOAD} ${screenTitle}`;
            case ButtonType.Delete: return `${SYSTEM_CONST.ACTION_BUTTONS.DELETE} ${screenTitle}`;
            default: return `${SYSTEM_CONST.ACTION_BUTTONS.ADD} ${screenTitle}`;
        }
    }

    confirmAndCallApi = (config: {
        title: string;
        message: string;
        confirmText?: string;
        request: () => void;
        loadingSignal?: WritableSignal<boolean>;
    }): void => {
        this.confirmService.confirm({
            title: config.title,
            message: config.message,
            confirmText: config.confirmText ?? 'Confirm',
        }).subscribe((confirmed) => {
            if (!confirmed) return;
            config.loadingSignal?.set(true);
            config.request();
        });
    }

    verifyEmailAndConfirm = (config: {
        data: EmailConfirmation | null;
        isConfirmed: boolean;
        store: any;
        isSaveClickedSignal?: WritableSignal<boolean>;
    }): Observable<boolean> => {
        if (config.data && config.data.isEmailExists && !config.isConfirmed) {
            config.store.clearSuccess();

            const dialogRef = this.genericDialogService.open<any, boolean>({
                title: EMAIL_VALIDATION_CONST.DIALOG_TITLE,
                component: EmailConflictDialog,
                width: '450px',
                data: { conflicts: config.data.existedTypesList || [] },
                showCloseButton: true,
                actions: [
                    {
                        ...getButtonConfig(() => { }, 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL),
                        result: false,
                    },
                    {
                        ...getButtonConfig(() => { }, 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.CONTINUE, true),
                        result: true,
                    },
                ]
            });

            return dialogRef.afterClosed();
        } else if (config.store.isSuccess()) {
            if (config.isSaveClickedSignal) {
                config.isSaveClickedSignal.set(true);
            }
        }
        return of(true);
    }

    saveWithEmailVerification = <T extends EmailConfirmation | EmailConfirmation[], R = T>(config: {
        store: any;
        endpoint: string;
        payload: T;
        isSaveClickedSignal?: WritableSignal<boolean>;
    }): Observable<R | null> => {
        if (config.isSaveClickedSignal) {
            config.isSaveClickedSignal.set(false);
        }

        return config.store.createWithResult({
            endpoint: config.endpoint,
            body: config.payload
        }).pipe(
            switchMap((data: any) => {
                const isArray = Array.isArray(config.payload);
                const isConfirmed = isArray
                    ? ((config.payload as any[])[0]?.isConfirmed ?? false)
                    : ((config.payload as any).isConfirmed ?? false);

                return this.verifyEmailAndConfirm({
                    data,
                    isConfirmed,
                    store: config.store,
                    isSaveClickedSignal: config.isSaveClickedSignal
                }).pipe(
                    switchMap(confirmed => {
                        if (confirmed && data && data.isEmailExists) {
                            if (isArray) {
                                (config.payload as any[]).forEach(p => p.isConfirmed = true);
                            } else {
                                (config.payload as any).isConfirmed = true;
                            }
                            if (config.isSaveClickedSignal) {
                                config.isSaveClickedSignal.set(true);
                            }
                            return config.store.createWithResult({
                                endpoint: config.endpoint,
                                body: config.payload
                            });
                        }
                        if (!confirmed && data && data.isEmailExists) {
                            return EMPTY;
                        }
                        return of(data);
                    })
                );
            })
        );
    }
    getPermissionByPage = (url?: string) => {
        const defaultPermission = {
            canCreate: false,
            canUpdate: false,
            canView: false,
            canDelete: false,
            canList: false,
            canConfigure: false,
            canMark : false,
            showGridAction: false
        };

        const storeList = this.menuStore.list();
        if (!storeList) return defaultPermission;

        const { pageDtos, rolePermissionDtos } = storeList;

        if (!pageDtos || !rolePermissionDtos) return defaultPermission;

        const currentUrl = url ?? this.router.url.split('?')[0].split('#')[0];
        const segments = currentUrl.split('/').filter(s => s !== '');
        const actionIndex = segments.findIndex(seg => ['add', 'edit', 'view'].includes(seg));

        let pageUrl = '';
        if (actionIndex !== -1) {
            const action = segments[actionIndex];
            // edit and view must have a valid GUID after them
            if (['edit', 'view'].includes(action)) {
                const id = segments[actionIndex + 1];
                if (!id || !id.match(REGEX_CONST.GUID)) return defaultPermission;
            }
            // Base page URL is everything before the action
            pageUrl = segments.slice(0, actionIndex).join('/');
        } else {
            // No action keyword, use the full URL
            pageUrl = segments.join('/');
        }

        const pageId = pageDtos?.find(item =>
            item.url != null && item.url.replace(/^\/+/, '') === pageUrl.replace(/^\/+/, '')
        )?.pageId;

        if (!pageId) return defaultPermission;

        // Find all permissions matching this page (either as direct page or parent page for actions)
        const perms = rolePermissionDtos?.filter(i => i.pageId === pageId || i.parentPageId === pageId);

        const permObj: any = {
            canCreate: false,
            canUpdate: false,
            canView: false,
            canDelete: false,
            canList: false,
            canConfigure: false,
            canMark : false,
            showGridAction: false
        };

        perms?.forEach(p => {
            if (p.mnemonic) {
                const camelMnemonic = p.mnemonic.charAt(0).toLowerCase() + p.mnemonic.slice(1);
                permObj[camelMnemonic] = p.isAllowed;
                permObj[p.mnemonic] = p.isAllowed;
            }
        });

        permObj.showGridAction = !!(permObj.canUpdate || permObj.canDelete || permObj.canView);
        return permObj;
    }

    async scrollToInvalidController(elementRef: ElementRef | HTMLElement | ElementRef[], isFormArray: boolean = false): Promise<boolean> {
        if (isFormArray && Array.isArray(elementRef)) {
            for (const formRef of elementRef) {
                const root = formRef.nativeElement as HTMLElement;
                const invalid = root.querySelector('.ng-invalid:not(form):not(fieldset)');
                if (invalid) {
                    this.scrollToInvalidController(formRef, false);
                    return true;
                }
            }
            return null;
        }

        const findDeepestInvalidElement = (root: HTMLElement): HTMLElement | null => {
            const invalidElements = root.querySelectorAll('.ng-invalid:not(form):not(fieldset)');
            for (const element of Array.from(invalidElements)) {
                const innerInvalid = element.querySelector('.ng-invalid:not(form):not(fieldset)');
                if (!innerInvalid) return element as HTMLElement;
            }
            return null;
        };

        const rootElement = elementRef instanceof ElementRef ? elementRef.nativeElement : (elementRef as HTMLElement);
        const firstInvalidControl = findDeepestInvalidElement(rootElement);
        if (!firstInvalidControl) return null;

        await this.ensureParentAccordionsOpen(firstInvalidControl);
        await this.scrollAndFocus(firstInvalidControl);
        return true;
    }
    async ensureParentAccordionsOpen(element: HTMLElement): Promise<void> {
        let parent = element.parentElement;
        const openingPromises: Promise<void>[] = [];

        while (parent) {
            if (parent.tagName.toLowerCase() === 'mat-expansion-panel') {
                const isExpanded = parent.classList.contains('mat-expanded');

                if (!isExpanded) {
                    const header = parent.querySelector('mat-expansion-panel-header') as HTMLElement;
                    const contentArea = parent.querySelector('.mat-expansion-panel-content') as HTMLElement;

                    if (header && contentArea) {
                        const animationFinished = new Promise<void>((resolve) => {
                            const onTransitionEnd = (event: TransitionEvent) => {
                                if (event.propertyName === 'height' || event.propertyName === 'grid-template-rows') {
                                    contentArea.removeEventListener('transitionend', onTransitionEnd);
                                    resolve();
                                }
                            };
                            contentArea.addEventListener('transitionend', onTransitionEnd);
                            setTimeout(resolve, 600);
                        });
                        header.click();
                        openingPromises.push(animationFinished);
                    }
                }
            }
            parent = parent.parentElement;
        }

        if (openingPromises.length > 0) {
            await Promise.all(openingPromises);
        }
    }
    private async scrollAndFocus(target: HTMLElement): Promise<void> {
        const header = document.querySelector('.header') as HTMLElement;
        const headerOffset = header ? header.offsetHeight : 0;
        const elementRect = target.getBoundingClientRect();
        if (elementRect.top < headerOffset)
            target.style.scrollMarginTop = `${headerOffset + 24}px`;

        return new Promise((resolve) => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animationFrameScheduler.schedule(() => {
                            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                        });

                        const formField = target.closest('mat-form-field');
                        const dateToggleBtn = formField ? formField.querySelector('mat-datepicker-toggle button') as HTMLElement : null;
                        const matSelectTrigger = target.querySelector('.mat-mdc-select-trigger');
                        const radioInput = target.querySelector('mat-radio-button input[type="radio"]') as HTMLInputElement;
                        const checkBoxInput = target.querySelector('mat-checkbox input[type="checkbox"]') as HTMLInputElement;
                        if (matSelectTrigger) {
                            target.focus();
                            (matSelectTrigger as HTMLElement).click();
                        } else if (radioInput)
                            radioInput.focus();
                        else if (checkBoxInput)
                            checkBoxInput.focus();
                        else if (dateToggleBtn) {
                            target.focus();
                            dateToggleBtn.click();
                        } else
                            target.focus();

                        observer.disconnect();
                        resolve();
                    }
                });
            }, { threshold: [0.5, 0.75, 1.0] });
            observer.observe(target);
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }
}
