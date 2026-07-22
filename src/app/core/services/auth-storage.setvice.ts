import { Injectable } from '@angular/core';
import { IAuthState, initialAuthState } from '../../features/auth/login/models/login.model';
import CommonHelper from '../helpers/common-helper';

export const STORAGE_KEYS = {
    ACCESS_TOKEN: 'auth_access_token',
    REFRESH_TOKEN: 'auth_refresh_token',
    ACCESS_TOKEN_EXPIRY: 'auth_access_expiry',
    REFRESH_TOKEN_EXPIRY: 'auth_refresh_expiry',
    USER_ID: 'auth_user_id',
    ENTITY_ID: 'auth_entity_id',
    EMAIL: 'auth_email',
    NAME: 'auth_name',
    ROLE: 'auth_role',
    ROLE_PREFIX: 'auth_role_prefix',
    PERMISSION: 'auth_permission',
    GRID_STATE: 'grid_states',
    ACADEMIC_YEAR_ID: 'auth_academic_year_id',
    BRANCH_ID: 'auth_branch_id',
    ACADEMIC_YEAR_START_DATE: 'auth_academic_year_start_date',
    ACADEMIC_YEAR_END_DATE: 'auth_academic_year_end_date',
    IS_CURRENT_ACADEMIC_YEAR: 'auth_is_current_academic_year',
    IS_PRIMARY_ADMIN: 'auth_is_primary_admin',
    PROFILE_PHOTO: 'auth_profile_photo',
} as const;

export const TOKEN_VALIDITY = {
    REFRESH_TOKEN_DAYS: 7
} as const;

@Injectable({ providedIn: 'root' })
export class AuthStorageService {

    save(state: IAuthState): void {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, state.accessToken ?? '');
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, state.refreshToken ?? '');
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY, state.accessTokenExpiry ?? '');
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY, state.refreshTokenExpiry ?? '');
        localStorage.setItem(STORAGE_KEYS.USER_ID, state.userId ?? '');
        localStorage.setItem(STORAGE_KEYS.ENTITY_ID, state.entityid ?? '');
        localStorage.setItem(STORAGE_KEYS.EMAIL, state.email ?? '');
        localStorage.setItem(STORAGE_KEYS.NAME, state.name ?? '');
        localStorage.setItem(STORAGE_KEYS.ROLE, state.usertype ?? '');
        localStorage.setItem(STORAGE_KEYS.ROLE_PREFIX, state.rolePrefix ?? '');
    }

    load(): IAuthState {
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const accessTokenExpiry = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRY);
        const refreshTokenExpiry = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN_EXPIRY);
        const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        const entityid = localStorage.getItem(STORAGE_KEYS.ENTITY_ID);
        const email = localStorage.getItem(STORAGE_KEYS.EMAIL);
        const name = localStorage.getItem(STORAGE_KEYS.NAME);
        const usertype = localStorage.getItem(STORAGE_KEYS.ROLE);
        const rolePrefix = localStorage.getItem(STORAGE_KEYS.ROLE_PREFIX);

        if (!accessToken || !refreshToken) {
            return initialAuthState();
        }

        return {
            ...initialAuthState(),
            accessToken,
            refreshToken,
            isLoggedIn: true,
            accessTokenExpiry,
            refreshTokenExpiry,
            userId,
            entityid,
            email,
            name,
            usertype,
            rolePrefix,
            userTypes: null
        };
    }

    clear(): void {
        Object.values(STORAGE_KEYS).forEach(key =>
            localStorage.removeItem(key)
        );
    }

    calculateExpiry(days: number): string {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }
}