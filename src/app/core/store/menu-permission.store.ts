import { patchState, signalStore, withMethods, withState, withHooks } from "@ngrx/signals";
import { IApiResponse, initialApiState } from "../models/request.model";
import { IMenuPermission } from "../models/menu-permission.model";
import { inject, effect, untracked } from "@angular/core";
import { HttpService } from "../services/http.service";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap, tap } from "rxjs";
import { tapResponse } from "@ngrx/operators";
import { API } from "../../shared/constants/api-url";
import { AuthStore } from "./auth.store";
import { PermissionRefreshService } from "../services/permission-refresh.service";

interface IGenericApiState<IMenuPermission> {
    list: IMenuPermission | null;
    isLoading: boolean,
    error: string | null,
    isSuccess: boolean
}

const initialState = <IMenuPermission>(): IGenericApiState<IMenuPermission> => ({
    ...initialApiState<IMenuPermission>(),
    list: null,
    isLoading: false,
    error: null,
    isSuccess: false
});

export const MenuPermissionStore = signalStore(
    { providedIn: 'root' },
    withState<IGenericApiState<IMenuPermission>>(initialState<IMenuPermission>()),
    withMethods((store, http = inject(HttpService), auth = inject(AuthStore)) => ({
        getAll: rxMethod(
            pipe(
                tap(() => patchState(store, {
                    list: null,
                    isLoading: true,
                    error: null,
                    isSuccess: false
                })),
                switchMap(() =>
                    http.get<IApiResponse<IMenuPermission>, any>(API.AUTH.ROLES_PERMISSION).pipe(
                        tapResponse({
                            next: (response) => {
                                patchState(store, {
                                    list: response.data,
                                    error: null,
                                    isLoading: false,
                                    isSuccess: true
                                })
                            },
                            error: (err: Error) => {
                                patchState(store, {
                                    list: null,
                                    error: err.message,
                                    isLoading: false,
                                    isSuccess: false
                                });
                                auth.frontendLogout();
                            }
                        })
                    )
                )
            )
        ),
        resetState(): void {
            patchState(store, initialState<IMenuPermission>());
        },
        clearError(): void {
            patchState(store, { error: null });
        },
        clearSuccess(): void {
            patchState(store, { isSuccess: false });
        },
        setData(data: IMenuPermission | null): void {
            patchState(store, { list: data });
        },
        setList(list: IMenuPermission): void {
            patchState(store, { list: list });
        }
    })
    ),
    withHooks((store, authStore = inject(AuthStore), refreshService = inject(PermissionRefreshService)) => {
        effect(() => {
            const isLoggedIn = authStore.isLoggedIn();
            refreshService.refreshSignal();

            untracked(() => {
                if (isLoggedIn) {
                    store.getAll({});
                } else {
                    store.resetState();
                }
            });
        });

        return {};
    })
);