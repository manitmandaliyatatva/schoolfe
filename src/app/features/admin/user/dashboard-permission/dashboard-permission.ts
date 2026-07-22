import { Component, OnInit, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { CommonDropdownComponent } from '../../../../shared/components/common-dropdown/common-dropdown.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CommonDropdownStore } from '../../../../core/store/common-dropdown.store';
import { getDropdownConfig, getButtonConfig } from '../../../../shared/functions/config-function';
import { DashboardPermissionStore } from './store/dashboard-permission.store';
import { AdminDashboardWidgets, StudentDashboardWidgets, TeacherDashboardWidgets, WidgetConfigItem } from '../../../../shared/components/dashboard/widget-configuration/model/widget-configuration.model';
import { UserTypeConst, compareUserType } from '../../../../shared/constants/user-type.constants';
import { LookupMnemonics } from '../../../../shared/constants/lookup-type-ids.constant';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { API } from '../../../../shared/constants/api-url';
import { distinctUntilChanged } from 'rxjs';
import { HttpService } from '../../../../core/services/http.service';

@UntilDestroy()
@Component({
    selector: 'app-dashboard-permission',
    imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatSlideToggleModule, MatIconModule, CommonDropdownComponent, ButtonComponent],
    providers: [DashboardPermissionStore],
    templateUrl: './dashboard-permission.html',
    styleUrl: './dashboard-permission.scss'
})
export class DashboardPermissionComponent implements OnInit {
    private fb = inject(FormBuilder);
    private store = inject(DashboardPermissionStore);
    private readonly USERTYPE_DROPDOWN_KEY = 'globalPermissionUserTypes';
    private readonly ROLE_DROPDOWN_KEY = 'globalPermissionRoles';
    public commonDropdownStore = inject(CommonDropdownStore);
    private http = inject(HttpService);

    protected readonly userTypeList = this.commonDropdownStore.getList(this.USERTYPE_DROPDOWN_KEY);
    protected readonly roleList = this.commonDropdownStore.getList(this.ROLE_DROPDOWN_KEY);

    form: FormGroup;

    userTypeDropdownConfig = signal<any>(getDropdownConfig('userTypeId', 'User Type'));
    roleDropdownConfig = signal<any>(getDropdownConfig('roleId', 'Role'));

    availableWidgets = signal<WidgetConfigItem<any>[]>([]);
    isAllEnabled = signal<boolean>(false);
    hasDashboardCanList = signal<boolean>(true);
    saveButtonConfig = signal<any>(getButtonConfig(() => this.onSave(), 'flat', 'primary', 'Save Permissions', true, () => this.form.invalid));

    constructor() {
        this.form = this.fb.group({
            userTypeId: [null, Validators.required],
            roleId: [null, Validators.required],
            widgets: this.fb.group({})
        });

        effect(() => {
            const userTypes = this.userTypeList();
            untracked(() => {
                this.userTypeDropdownConfig.update((cfg: any) => ({ ...cfg, data: userTypes }));
            });
        }, { allowSignalWrites: true });

        effect(() => {
            const roles = this.roleList();
            untracked(() => {
                this.roleDropdownConfig.update((cfg: any) => ({ ...cfg, data: roles }));
            });
        }, { allowSignalWrites: true });

        effect(() => {
            const isLoading = this.store.isLoading();
            const data = this.store.data();

            if (isLoading) return;

            untracked(() => {
                if (data && data.widgetConfiguration) {
                    try {
                        const parsedConfig = JSON.parse(data.widgetConfiguration);
                        this.form.controls['widgets'].patchValue(parsedConfig);
                    } catch (e) { }
                } else {
                    // Reset to all enabled by default if no config
                    const defaults: any = {};
                    this.availableWidgets().forEach(w => defaults[w.key] = true);
                    this.form.controls['widgets'].patchValue(defaults);
                }
            });
        });
    }

    ngOnInit(): void {
        this.commonDropdownStore.getDropdown({
            key: this.USERTYPE_DROPDOWN_KEY,
            endpoint: API.LOOKUP_VALUE.GET_LOOKUP_VALUE_LIST,
            params: { mnemonic: LookupMnemonics.UserTypeIds },
            mapData: (raw: any[]) => raw.map((r: any) => ({ text: r.text, value: r.value }))
        });

        this.form.get('userTypeId')?.valueChanges.pipe(untilDestroyed(this), distinctUntilChanged()).subscribe((userTypeId) => {
            this.form.get('roleId')?.setValue(null, { emitEvent: false });
            this.availableWidgets.set([]);
            this.hasDashboardCanList.set(true);
            const widgetsGroup = this.form.get('widgets') as FormGroup;
            Object.keys(widgetsGroup.controls).forEach(key => widgetsGroup.removeControl(key));

            if (userTypeId) {
                this.commonDropdownStore.getDropdown({
                    key: this.ROLE_DROPDOWN_KEY,
                    endpoint: API.ADMIN.USER.ROLE.ROLEBYUSERTYPE,
                    params: { userTypeId },
                    force: true,
                    mapData: (raw: any[]) => raw.map((r: any) => ({ text: r.text, value: r.value }))
                });
            } else {
                this.commonDropdownStore.resetKey(this.ROLE_DROPDOWN_KEY);
            }
        });

        this.form.get('roleId')?.valueChanges.pipe(untilDestroyed(this), distinctUntilChanged()).subscribe((roleId) => {
            if (roleId) {
                this.availableWidgets.set([]);
                this.hasDashboardCanList.set(false);
                this.loadWidgetsForRole(roleId);
            } else {
                this.hasDashboardCanList.set(true);
            }
        });

        this.form.get('widgets')?.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
            if (value && Object.keys(value).length > 0) {
                const allTrue = Object.values(value).every(v => v === true);
                this.isAllEnabled.set(allTrue);
            } else {
                this.isAllEnabled.set(false);
            }
        });
    }

    loadWidgetsForRole(roleId: string) {
        const userTypeId = this.form.get('userTypeId')?.value;
        let allWidgets: WidgetConfigItem<any>[] = [];

        if (userTypeId) {
            if (compareUserType(userTypeId, 'Admin') || compareUserType(userTypeId, 'SuperAdmin')) {
                allWidgets = AdminDashboardWidgets;
            } else if (compareUserType(userTypeId, 'Teacher')) {
                allWidgets = TeacherDashboardWidgets;
            } else if (compareUserType(userTypeId, 'Student')) {
                allWidgets = StudentDashboardWidgets;
            }
        }

        // Remove duplicates if any (though keys should be unique across dashboards)
        const uniqueWidgets = allWidgets.filter((v, i, a) => a.findIndex(t => (t.key === v.key)) === i);

        this.availableWidgets.set(uniqueWidgets);

        // Build form controls for widgets
        const widgetsGroup = this.form.get('widgets') as FormGroup;

        // Remove controls that are no longer needed
        Object.keys(widgetsGroup.controls).forEach(key => {
            if (!uniqueWidgets.find(w => w.key === key)) {
                widgetsGroup.removeControl(key);
            }
        });

        uniqueWidgets.forEach(widget => {
            const key = widget.key as string;
            if (widgetsGroup.contains(key)) {
                widgetsGroup.get(key)?.setValue(true);
            } else {
                widgetsGroup.addControl(key, this.fb.control(true)); // default to true
            }
        });

        this.checkRoleDashboardPermission(roleId, userTypeId);
        this.store.getByRole(roleId);
    }

    private checkRoleDashboardPermission(roleId: string, userTypeId: string) {
        this.http.get<any, any>(`${API.ADMIN.USER.ROLE_PERMISSIONS.GET_ROLE_BASED}`, { roleId }).subscribe(res => {
            const tree = res?.data;
            if (tree && tree.length > 0) {
                let targetDashboardUrl = '';
                if (compareUserType(userTypeId, 'Admin') || compareUserType(userTypeId, 'SuperAdmin')) {
                    targetDashboardUrl = 'admin/dashboard';
                } else if (compareUserType(userTypeId, 'Teacher')) {
                    targetDashboardUrl = 'teacher/dashboard';
                } else if (compareUserType(userTypeId, 'Student')) {
                    targetDashboardUrl = 'student/dashboard';
                }

                const hasList = this.findDashboardCanList(tree, targetDashboardUrl);
                this.hasDashboardCanList.set(hasList);
            } else {
                this.hasDashboardCanList.set(false);
            }
        });
    }

    private findDashboardCanList(nodes: any[], dashboardUrl: string): boolean {
        if (!nodes || !dashboardUrl) return false;

        for (const node of nodes) {
            if (node.url && node.url.toLowerCase().endsWith(dashboardUrl.toLowerCase())) {
                if (node.permissions && node.permissions.length > 0) {
                    const listAction = node.permissions.find((p: any) => p.mnemonic?.toLowerCase() === 'canlist');
                    if (listAction && listAction.isAllowed) {
                        return true;
                    }
                }
            }
            if (node.permissions && node.permissions.length > 0) {
                if (this.findDashboardCanList(node.permissions, dashboardUrl)) {
                    return true;
                }
            }
        }
        return false;
    }

    toggleAll(checked: boolean) {
        const widgetsGroup = this.form.get('widgets') as FormGroup;
        if (!widgetsGroup) return;
        const patch: any = {};
        Object.keys(widgetsGroup.controls).forEach(key => {
            patch[key] = checked;
        });
        widgetsGroup.patchValue(patch);
        widgetsGroup.updateValueAndValidity();
    }

    onSave() {
        if (this.form.invalid) return;

        const roleId = this.form.get('roleId')?.value;
        const widgetsFormValue = this.form.get('widgets')?.value;

        const dto = {
            roleId: roleId,
            widgetConfiguration: JSON.stringify(widgetsFormValue)
        };

        this.store.save({ dto });
    }
}
