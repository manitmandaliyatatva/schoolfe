import { pendingChangesGuard } from '../../../core/guards/pending-changes.guard';
import { Route } from "@angular/router";
import { authGuard } from "../../../core/guards/auth-guard";
import { SettingsComponent } from "./settings";
import { SettingGroupList } from "./setting-group/list/setting-group-list";
import { SettingGroupForm } from "./setting-group/form/setting-group-form";
import { SettingDefinitionList } from "./setting-defination/list/setting-definition-list";
import { SettingDefinitionForm } from "./setting-defination/form/setting-definition-form";
import { GeneralSettings } from "./general-setting/form/general-settings";


export const SETTINGS_ROUTE: Route[] = [
    {
        path: '',
        component: SettingsComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'add-carousel',
            },
            {
                path: 'setting-group',
                component: SettingGroupList,
                title: 'Setting Group',
            },
            {
                path: 'setting-group/add',
                component: SettingGroupForm,
                title: 'Add Setting Group',
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: 'setting-group/edit/:settingGroupId',
                component: SettingGroupForm,
                title: 'Edit Setting Group',
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: 'setting-definition',
                component: SettingDefinitionList,
                title: 'Setting Definition',
            },
            {
                path: 'setting-definition/add',
                component: SettingDefinitionForm,
                title: 'Add Definition',
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: `setting-definition/edit/:settingDefinitionId`,
                component: SettingDefinitionForm,
                title: 'Edit Setting Definition',
            //canDeactivate: [pendingChangesGuard],
                },
            {
                path: 'general-setting',
                component: GeneralSettings,
                title: 'General Settings',
            },
        ],
    },
]
