import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
    patchState,
    signalStore,
    withMethods,
    withState
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, Observable, pipe, switchMap, tap, throwError } from 'rxjs';
import { HttpService } from '../services/http.service';
import {
    IGetAllRequest,
    IGetByIdRequest,
    ICreateRequest,
    IUpdateRequest,
    IDeleteRequest,
    IApiState,
    initialApiState,
    IApiResponse,
    IDataTableResponse
} from '../models/request.model';
import { HttpSuccess } from '../constants/http-status-code.constatnt';
import CommonHelper from '../helpers/common-helper';
// ✅ Update IGenericApiState to handle paginated response
interface IGenericApiState<T> extends IApiState<T> {
    list: T[];
    totalRecords: number;
    recordsFiltered: number;
    draw: number;
}

const initialState = <T>(): IGenericApiState<T> => ({
    ...initialApiState<T>(),
    list: [],
    totalRecords: 0,
    recordsFiltered: 0,
    draw: 0
});

export function createGenericStore<T>() {
    return signalStore(
        { providedIn: 'root' },
        withState<IGenericApiState<T>>(initialState<T>()),

        withMethods((store, http = inject(HttpService)) => ({

            // ✅ Synchronous Setters for Dashboard Aggregation
            setGenericState: (data: Partial<IGenericApiState<T>>) => patchState(store, { ...data, isSuccess: true, isLoading: false }),

            // ✅ getAll — unwraps nested response automatically
            getAll: rxMethod<IGetAllRequest>(
                pipe(
                    tap(() => patchState(store, {
                        isLoading: true,
                        error: null,
                        isSuccess: false
                    })),
                    switchMap(({ endpoint, body, params }) => {

                        const request$ = body
                            ? http.post<IApiResponse<IDataTableResponse<T>>, any>(endpoint, body, params)
                            : http.get<IApiResponse<IDataTableResponse<T>>, any>(endpoint, params);

                        return request$.pipe(
                            tapResponse({
                                next: (response) => {
                                    const tableData = response?.data;
                                    patchState(store, {
                                        list: tableData?.data ?? [],
                                        totalRecords: tableData?.recordsTotal ?? 0,
                                        recordsFiltered: tableData?.recordsFiltered ?? 0,
                                        draw: tableData?.draw ?? 0,
                                        isLoading: false,
                                        isSuccess: HttpSuccess.includes(response?.statusCode)
                                    });
                                },
                                error: (err: Error) => patchState(store, {
                                    error: err.message,
                                    isLoading: false,
                                    isSuccess: false
                                })
                            })
                        );
                    })
                )
            ),

            // ✅ create — unwraps single response
            create: rxMethod<ICreateRequest<T>>(
                pipe(
                    tap(() => patchState(store, {
                        isSubmitting: true,
                        error: null,
                        isSuccess: false
                    })),
                    switchMap(({ endpoint, body }) =>
                        http.post<IApiResponse<T>, any>(endpoint, body as object).pipe(
                            tapResponse({
                                next: (response) => patchState(store, {
                                    // ✅ Unwrap response.data
                                    data: response?.data ?? null,
                                    isSubmitting: false,
                                    isSuccess: HttpSuccess.includes(response?.statusCode)
                                }),
                                error: (err: Error) => patchState(store, {
                                    error: err.message,
                                    isSubmitting: false,
                                    isSuccess: false
                                })
                            })
                        )
                    )
                )
            ),

            // ✅ update — unwraps single response
            createWithResult(request: ICreateRequest<T>): Observable<T | null> {
                patchState(store, {
                    isSubmitting: true,
                    error: null,
                    isSuccess: false
                });

                return http.post<IApiResponse<T>, any>(request.endpoint, request.body as object).pipe(
                    map((response) => {
                        const data = response?.data ?? null;
                        patchState(store, {
                            data,
                            isSubmitting: false,
                            isSuccess: HttpSuccess.includes(response?.statusCode)
                        });
                        return data;
                    }),
                    catchError((err: Error) => {
                        patchState(store, {
                            error: err.message,
                            isSubmitting: false,
                            isSuccess: false
                        });
                        return throwError(() => err);
                    })
                );
            },

            getWithResult<R = T>(request: IGetByIdRequest): Observable<R | null> {
                patchState(store, {
                    isLoading: true,
                    error: null,
                    isSuccess: false
                });

                const request$ = request.params || CommonHelper.isEmpty(request.id)
                    ? http.get<IApiResponse<R>, any>(request.endpoint, request.params)
                    : http.getById<IApiResponse<R>, any>(request.endpoint, String(request.id));

                return request$.pipe(
                    map((response) => {
                        const data = response?.data ?? null;
                        
                        const updateState: any = {
                            isLoading: false,
                            isSuccess: HttpSuccess.includes(response?.statusCode)
                        };

                        if (Array.isArray(data)) {
                            updateState.list = data;
                        } else {
                            updateState.data = data;
                        }

                        patchState(store, updateState);
                        return data;
                    }),
                    catchError((err: Error) => {
                        patchState(store, {
                            error: err.message,
                            isLoading: false,
                            isSuccess: false
                        });
                        return throwError(() => err);
                    })
                );
            },

            update: rxMethod<IUpdateRequest<T>>(
                pipe(
                    tap(() => patchState(store, {
                        isSubmitting: true,
                        error: null,
                        isSuccess: false
                    })),
                    switchMap(({ endpoint, body, params }) =>
                        http.put<IApiResponse<T>, any>(endpoint, body as object, params).pipe(
                            tapResponse({
                                next: (response) => patchState(store, {
                                    // ✅ Unwrap response.data
                                    data: response?.data ?? null,
                                    isSubmitting: false,
                                    isSuccess: HttpSuccess.includes(response?.statusCode)
                                }),
                                error: (err: Error) => patchState(store, {
                                    error: err.message,
                                    isSubmitting: false,
                                    isSuccess: false
                                })
                            })
                        )
                    )
                )
            ),

            // ✅ getById — unwraps single response
            getById: rxMethod<IGetByIdRequest>(
                pipe(
                    tap(() => patchState(store, {
                        isLoading: true,
                        error: null,
                        isSuccess: false
                    })),
                    switchMap(({ endpoint, id, params }) => {
                        const request$ = params || CommonHelper.isEmpty(id)
                            ? http.get<IApiResponse<T>, any>(endpoint, params)
                            : http.getById<IApiResponse<T>, any>(endpoint, String(id));

                        return request$.pipe(
                            tapResponse({
                                next: (response) => patchState(store, {
                                    // ✅ Unwrap response.data
                                    data: response?.data ?? null,
                                    isLoading: false,
                                    isSuccess: HttpSuccess.includes(response?.statusCode)
                                }),
                                error: (err: Error) => patchState(store, {
                                    error: err.message,
                                    isLoading: false,
                                    isSuccess: false
                                })
                            })
                        );
                    })
                )
            ),

            // ✅ remove
            remove: rxMethod<IDeleteRequest>(
                pipe(
                    tap(() => patchState(store, {
                        isSubmitting: true,
                        error: null,
                        isSuccess: false
                    })),
                    switchMap(({ endpoint, id, idKey, params }) => {
                        const resolvedParams = params
                            ?? ((idKey && !CommonHelper.isEmpty(id)) ? { [idKey]: id } : undefined);

                        const request$ = resolvedParams
                            ? http.delete<IApiResponse<T>, any>(endpoint, undefined, resolvedParams)
                            : http.delete<IApiResponse<T>, any>(`${endpoint}/${id}`);

                        return request$.pipe(
                            tapResponse({
                                next: (response) => patchState(store, {
                                    isSubmitting: false,
                                    isSuccess: HttpSuccess.includes(response?.statusCode)
                                }),
                                error: (err: Error) => patchState(store, {
                                    error: err.message,
                                    isSubmitting: false,
                                    isSuccess: false
                                })
                            })
                        );
                    })
                )
            ),

            // ─── Utility ─────────────────────────────────────────────
            resetState(): void {
                patchState(store, initialState<T>());
            },
            clearError(): void {
                patchState(store, { error: null });
            },
            clearSuccess(): void {
                patchState(store, { isSuccess: false });
            },
            setData(data: T | null): void {
                patchState(store, { data });
            },
            setList(list: T[]): void {
                patchState(store, { list });
            }
        }))
    );
}
