import { HttpClient } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import {
    getState,
    patchState,
    signalStore,
    withComputed,
    withHooks,
    withMethods,
    withState
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, shareReplay } from 'rxjs/operators';
import { IAuthApiResponse, IAuthState, IChangePasswordRequest, IForgotPasswordRequest, ILoginResponse, initialAuthState, IResetPasswordRequest, LoginModel } from '../../features/auth/login/models/login.model';
import { API } from '../../shared/constants/api-url';
import { HttpSuccess } from '../constants/http-status-code.constatnt';
import { AuthStorageService } from '../services/auth-storage.setvice';
import { TokenDecoderService } from '../services/token.decoder.service';
import { ToastrHelperService } from '../services/toster-helper.service';
import { SYSTEM_CONST } from '../constants/system.constant';


export const AuthStore = signalStore(

    { providedIn: 'root' },

    withState<IAuthState>(() => {
        const storage = new AuthStorageService();
        return storage.load();
    }),

    // ─── Computed signals ────────────────────────────────────────
    withComputed((store) => ({

        // ✅ Check refresh token validity — 7 days
        isLoggedIn: computed(() => {
            const state = store.isLoggedIn();
            if (!state || !store.refreshToken()) return false;

            const expiry = store.refreshTokenExpiry();
            if (!expiry) return false;

            return new Date() < new Date(expiry);
        }),

        // ✅ Current user info
        currentUser: computed(() => ({
            userId: store.userId(),
            entityId: store.entityid(),
            email: store.email()
        })),

        // ✅ User Roles
        isAdmin: computed(() => store.usertype() === 'Admin' || store.usertype() === 'Super Admin'),
        isStudent: computed(() => store.usertype() === 'Student'),
        isTeacher: computed(() => store.usertype() === 'Teacher'),
        isParent: computed(() => store.usertype() === 'Parent'),
        isSuperAdmin: computed(() => store.usertype() === 'Super Admin'),
        isPrimaryAdmin: computed(() => store.isprimaryadmin()),
        roleRoutePath: computed(() => {
            const userType = store.usertype()?.toLowerCase() ?? '';
            return (userType === 'super admin' || userType === 'admin') ? 'admin' : userType;
        }),
    })),

    // ─── Methods ─────────────────────────────────────────────────
    withMethods((
        store,
        http = inject(HttpClient),
        router = inject(Router),
        tokenDecoder = inject(TokenDecoderService),
        storage = inject(AuthStorageService),
        toaster = inject(ToastrHelperService),
        dialog = inject(MatDialog)
    ) => {
        let activeRefresh$: Observable<string> | null = null;

        // ✅ Centralized processing for tokens and user claims
        const updateAuthData = (data: Partial<ILoginResponse>): void => {
            const { accessToken, refreshToken, refreshTokenExpiry } = data;
            if (!accessToken) return;

            const userInfo = tokenDecoder.extractUserInfo(accessToken);

            const updates: any = {
                accessToken,
                accessTokenExpiry: userInfo?.expiryTime,
                userId: userInfo?.userId ?? store.userId(),
                entityid: userInfo?.entityid ?? store.entityid(),
                email: userInfo?.email ?? store.email(),
                name: userInfo?.name ?? store.name(),
                usertype: userInfo?.usertype ?? store.usertype(),
                rolePrefix: userInfo?.usertype ? `/${userInfo.usertype.toLowerCase()}` : store.rolePrefix(),
                userTypes: data.userTypes ?? store.userTypes(),
            };

            if (refreshToken) {
                updates.refreshToken = refreshToken;
                updates.refreshTokenExpiry = refreshTokenExpiry ? new Date(refreshTokenExpiry).toISOString() : null;
                updates.isLoggedIn = true;
                updates.isFirstTimeLogin = false;
                updates.tempToken = null;
            }

            patchState(store, updates);

            // ✅ Sync with storage
            const updatedState = { ...getState(store) };
            storage.save(updatedState as any);
        };

        const fetchUserContext = (callback?: () => void): void => {
            if (!store.isLoggedIn()) {
                if (callback) callback();
                return;
            }
            patchState(store, { isLoading: true, error: null, isSuccess: false });
            http.get<any>(API.AUTH.GET_USER_CONTEXT).subscribe({
                next: (res) => {
                    if (res?.data) {
                        patchState(store, {
                            academicyearid: res.data.academicYearId,
                            branchid: res.data.branchId,
                            academicyearstartdate: res.data.academicYearStartDate,
                            academicyearenddate: res.data.academicYearEndDate,
                            iscurrentacademicyear: res.data.isCurrentAcademicYear,
                            isprimaryadmin: res.data.isPrimaryAdmin,
                            profilePhoto: res.data.profilePhoto,
                            isLoading: false,
                            isSuccess: true,
                            error: null
                        });
                    } else {
                        patchState(store, {
                            isLoading: false,
                            isSuccess: false,
                            error: res?.message ?? SYSTEM_CONST.ERRORS.USER_CONTEXT_FAILED
                        });
                    }
                    if (callback) callback();
                },
                error: (err) => {
                    patchState(store, {
                        isLoading: false,
                        isSuccess: false,
                        error: err?.message ?? SYSTEM_CONST.ERRORS.USER_CONTEXT_FAILED
                    });
                    if (callback) callback();
                }
            });
        };

        const updateAccessTokens = (accessToken: string, callback?: () => void): void => {
            updateAuthData({ accessToken });
            fetchUserContext(callback);
        };

        const frontendLogout = (): void => {
            patchState(store, initialAuthState());
            storage.clear();
            dialog.closeAll();
            router.navigate(['/login']);
        };

        const refreshAccessToken = (): Observable<string> => {
            if (activeRefresh$) {
                return activeRefresh$;
            }

            const refreshToken = store.refreshToken();
            const accessToken = store.accessToken();
            if (!refreshToken || !accessToken) {
                frontendLogout();
                return throwError(() => new Error(SYSTEM_CONST.ERRORS.INVALID_REFRESH_TOKEN));
            }

            activeRefresh$ = http.post<IAuthApiResponse<ILoginResponse>>(API.AUTH.REFRESH_TOKEN, { refreshToken, accessToken }).pipe(
                switchMap((response) => {
                    if (HttpSuccess.includes(response?.statusCode) && response?.data?.accessToken) {
                        updateAccessTokens(response.data.accessToken);
                        return of(response.data.accessToken);
                    } else {
                        frontendLogout();
                        return throwError(() => new Error(SYSTEM_CONST.ERRORS.INVALID_REFRESH_TOKEN));
                    }
                }),
                catchError((err) => {
                    frontendLogout();
                    return throwError(() => err);
                }),
                shareReplay(1),
                finalize(() => {
                    activeRefresh$ = null;
                })
            );

            return activeRefresh$;
        };

        return {

            // ✅ LOGIN
            login: rxMethod<LoginModel>(
                pipe(
                    tap(() => patchState(store, {
                        isLoading: true,
                        error: null,
                        isSuccess: false
                    })),
                    switchMap((request) =>
                        http.post<IAuthApiResponse<ILoginResponse>>(API.AUTH.LOGIN, request).pipe(
                            tapResponse({
                                next: (response) => {
                                    if (HttpSuccess.includes(response?.statusCode) && response?.data) {
                                        const data: ILoginResponse = response.data;

                                        if (data.isFirstTimeLogin) {
                                            patchState(store, {
                                                isFirstTimeLogin: true,
                                                tempToken: data.tempToken,
                                                isLoggedIn: false,
                                                isLoading: false,
                                                isSuccess: true
                                            });
                                            storage.save(getState(store) as any);
                                        } else if (data.accessToken) {
                                            updateAuthData(data);
                                            patchState(store, { isLoading: false, isSuccess: true, userTypes: data.userTypes ?? store.userTypes() });
                                        } else if (data.userTypes && data.userTypes.length > 1 && !request.userTypeId) {
                                            patchState(store, {
                                                userTypes: data.userTypes,
                                                isLoading: false,
                                                isSuccess: true,
                                                isLoggedIn: false
                                            });
                                        } else {
                                            patchState(store, {
                                                isLoading: false,
                                                isSuccess: false,
                                                error: SYSTEM_CONST.ERRORS.UNAUTHORIZED.NO_ROLE
                                            });
                                        }
                                    }
                                },
                                error: (err: Error) => patchState(store, {
                                    error: err.message ?? SYSTEM_CONST.ERRORS.LOGIN_FAILED,
                                    isLoading: false,
                                    isSuccess: false
                                })
                            })
                        )
                    )
                )
            ),

            // ✅ FORGOT PASSWORD
            forgotPassword: rxMethod<IForgotPasswordRequest>(
                pipe(
                    tap(() => patchState(store, {
                        isLoading: true,
                        error: null,
                        isSuccess: false
                    })),
                    switchMap((request) =>
                        http.get<IAuthApiResponse<any>>(API.AUTH.FORGOT_PASSWORD, {
                            params: { email: request.email }
                        }).pipe(
                            tapResponse({
                                next: (response) => {
                                    if (HttpSuccess.includes(response?.statusCode)) {
                                        patchState(store, {
                                            isLoading: false,
                                            isSuccess: true
                                        });
                                        toaster.showSuccessMessage(response.message);
                                        router.navigate(['/login']);
                                    }
                                },
                                error: (err: Error) => {
                                    patchState(store, {
                                        error: err.message,
                                        isLoading: false,
                                        isSuccess: false
                                    });
                                }
                            })
                        )
                    )
                )
            ),

            // ✅ RESET PASSWORD
            resetPassword: rxMethod<IResetPasswordRequest>(
                pipe(
                    tap(() => patchState(store, {
                        isLoading: true,
                        error: null,
                        isSuccess: false
                    })),
                    switchMap((request) =>
                        http.post<IAuthApiResponse<any>>(API.AUTH.RESET_PASSWORD, request).pipe(
                            tapResponse({
                                next: (response) => {
                                    if (HttpSuccess.includes(response?.statusCode)) {
                                        patchState(store, {
                                            isLoading: false,
                                            isSuccess: true,
                                            isFirstTimeLogin: false,
                                            tempToken: null
                                        });
                                        router.navigate(['/login']);
                                    }
                                },
                                error: (err: Error) => {
                                    patchState(store, {
                                        error: err.message,
                                        isLoading: false,
                                        isSuccess: false
                                    });
                                }
                            })
                        )
                    )
                )
            ),

            // ✅ CHANGE PASSWORD
            changePassword: rxMethod<IChangePasswordRequest>(
                pipe(
                    tap(() => patchState(store, {
                        isLoading: true,
                        error: null,
                        isSuccess: false
                    })),
                    switchMap((request) =>
                        http.post<IAuthApiResponse<any>>(API.AUTH.CHANGE_PASSWORD, request).pipe(
                            tapResponse({
                                next: (response) => {
                                    if (HttpSuccess.includes(response?.statusCode)) {
                                        patchState(store, {
                                            isLoading: false,
                                            isSuccess: true
                                        });
                                        frontendLogout();
                                    }
                                },
                                error: (err: Error) => {
                                    patchState(store, {
                                        error: err.message,
                                        isLoading: false,
                                        isSuccess: false
                                    });
                                }
                            })
                        )
                    )
                )
            ),

            // ✅ LOGOUT — sync method
            logout: rxMethod<void>(
                pipe(
                    tap(() => patchState(store, {
                        isLoading: true,
                        error: null
                    })),
                    switchMap(() =>
                        http.post<IAuthApiResponse<any>>(API.AUTH.LOGOUT, {
                            refreshToken: store.refreshToken()
                        }).pipe(
                            tapResponse({
                                next: (response) => {
                                    patchState(store, initialAuthState());
                                    storage.clear();
                                    router.navigate(['/login']);
                                },
                                error: (err: Error) => {
                                    patchState(store, initialAuthState());
                                    storage.clear();
                                    router.navigate(['/login']);
                                }
                            })
                        )
                    )
                )
            ),

            // ✅ Frontend only logout
            frontendLogout,

            // ✅ Clear error
            clearError(): void {
                patchState(store, { error: null });
            },

            // ✅ Clear success
            clearSuccess(): void {
                patchState(store, { isSuccess: false });
            },

            // ✅ Token Refresh Method
            refreshAccessToken,

            // ✅ Update access token manually
            updateAccessTokens,

            // ✅ Fetch user context
            fetchUserContext
        };
    }),

    // ─── Hooks ───────────────────────────────────────────────────
    withHooks({

        // ✅ onInit — check token expiry when app starts
        onInit(store) {
            const refreshExpiry = store.refreshTokenExpiry();

            if (refreshExpiry && new Date() > new Date(refreshExpiry)) {
                // ✅ Refresh token expired on app start → logout
                store.frontendLogout();
            }
        },

        // ✅ onDestroy
        onDestroy(store) {
            console.log('AuthStore destroyed');
        }
    })
);