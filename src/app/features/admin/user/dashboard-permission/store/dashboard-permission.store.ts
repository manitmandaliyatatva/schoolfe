import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap, catchError, of, Observable } from 'rxjs';
import { HttpService } from '../../../../../core/services/http.service';
import { API } from '../../../../../shared/constants/api-url';
import { DashboardPermissionDto, SaveDashboardPermissionDto } from './dashboard-permission.model';
import { ToastrService } from 'ngx-toastr';

interface DashboardPermissionState {
    data: DashboardPermissionDto | null;
    isLoading: boolean;
    error: any;
}

const initialState: DashboardPermissionState = {
    data: null,
    isLoading: false,
    error: null
};

export const DashboardPermissionStore = signalStore(
    withState(initialState),
    withMethods((store, httpService = inject(HttpService), toastr = inject(ToastrService)) => ({
        getByRole: rxMethod<string>(
            pipe(
                tap(() => patchState(store, { isLoading: true, data: null })),
                switchMap((roleId) => {
                    const url = `api/${API.SUPER_ADMIN.GLOBAL_DASHBOARD_PERMISSION.GET_BY_ROLE}/${roleId}`;
                    return httpService.get<any, any>(url).pipe(
                        tap((response) => {
                            patchState(store, { data: response.data, isLoading: false });
                        }),
                        catchError((error) => {
                            patchState(store, { error, isLoading: false });
                            return of(error);
                        })
                    );
                })
            )
        ),
        save: rxMethod<{ dto: SaveDashboardPermissionDto, callback?: () => void }>(
            pipe(
                tap(() => patchState(store, { isLoading: true })),
                switchMap(({ dto, callback }) => {
                    const url = `api/${API.SUPER_ADMIN.GLOBAL_DASHBOARD_PERMISSION.SAVE}`;
                    return httpService.post<any, any>(url, dto).pipe(
                        tap((response) => {
                            patchState(store, { data: response.data, isLoading: false });
                            if (callback) callback();
                        }),
                        catchError((error) => {
                            patchState(store, { error, isLoading: false });
                            return of(error);
                        })
                    );
                })
            )
        ),
        reset: () => patchState(store, initialState)
    }))
);
