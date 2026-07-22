import { Signal, computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, Observable, catchError, map, mergeMap, of, pipe, tap } from 'rxjs';
import { IApiResponse, IDataTableResponse, IGetAllRequest, IPaginationRequest } from '../models/request.model';
import { HttpSuccess } from '../constants/http-status-code.constatnt';
import { HttpService } from '../services/http.service';
import { ITextValueOption } from '../../shared/models/common.model';
import { SYSTEM_CONST } from '../constants/system.constant';

type DropdownState = {
  data: Record<string, ITextValueOption[]>;
  loading: Record<string, boolean>;
  error: Record<string, any[]>;
  rawData: Record<string, any[]>;
};

type DropdownRequest<T = any> = IGetAllRequest & {
  key: string;
  force?: boolean;
  mapData?: (items: T[]) => ITextValueOption[];
};

type DropdownPostRequest<T = any> = DropdownRequest & {
  mapData: (items: T[]) => ITextValueOption[];
};

const initialState: DropdownState = {
  data: {},
  loading: {},
  error: {},
  rawData: {},
};

const defaultDropdownPostBody: IPaginationRequest = {
  pageIndex: 0,
  pageSize: -1,
  generalSearch: '',
  defaultSortingColumn: '',
  sortOrder: 'asc',
};

const normalizeGetDropdownData = (
  response: IApiResponse<ITextValueOption[]> | any
): ITextValueOption[] => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

const getGetResponseItems = <T>(
  response: IApiResponse<T[]> | any
): T[] => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [] as T[];
};

const getPostResponseItems = <T>(
  response: IApiResponse<T[] | IDataTableResponse<T>> | any
): T[] => {
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [] as T[];
};

const toErrorList = (error: unknown): any[] => {
  const message =
    (error as { error?: { message?: string } })?.error?.message
    ?? (error as { message?: string })?.message
    ?? SYSTEM_CONST.ERRORS.FETCH_DROPDOWN;
  return [message];
};

const isHttpSuccess = (statusCode?: number): boolean =>
  typeof statusCode === 'number' && HttpSuccess.includes(statusCode);

export const CommonDropdownStore = signalStore(
  { providedIn: 'root' },
  withState<DropdownState>(initialState),
  withMethods((store, http = inject(HttpService)) => {
    const hasCachedData = (key: string): boolean => {
      const existing = store.data()[key];
      const raw = store.rawData()[key];
      return Array.isArray(existing) && existing.length > 0 && Array.isArray(raw) && raw.length > 0;
    };

    const setLoading = (key: string): void => {
      patchState(store, {
        loading: { ...store.loading(), [key]: true },
        error: { ...store.error(), [key]: [] },
      });
    };

    const setSuccess = (key: string, list: ITextValueOption[], raw?: any[]): void => {
      patchState(store, {
        data: { ...store.data(), [key]: list },
        rawData: { ...store.rawData(), [key]: raw ?? [] },
        loading: { ...store.loading(), [key]: false },
        error: { ...store.error(), [key]: [] },
      });
    };

    const setError = (key: string, error: any[]): void => {
      patchState(store, {
        data: { ...store.data(), [key]: [] },
        rawData: { ...store.rawData(), [key]: [] },
        loading: { ...store.loading(), [key]: false },
        error: { ...store.error(), [key]: error },
      });
    };

    const getDropdownRequest = rxMethod<DropdownRequest>(
      pipe(
        tap(({ key, force, mapData }) => {
          if (hasCachedData(key) && !force) {
            const raw = store.rawData()[key];
            if (Array.isArray(raw) && raw.length > 0 && mapData) {
              const list = mapData(raw);
              setSuccess(key, list, raw);
            }
            return;
          }
          setLoading(key);
        }),
        mergeMap(({ key, endpoint, params, force, mapData }) => {
          if (hasCachedData(key) && !force) return EMPTY;

          return http.get<IApiResponse<any[]>, any>(endpoint, params).pipe(
            tapResponse({
              next: (response) => {
                if (!isHttpSuccess(response?.statusCode)) {
                  setError(key, [response?.message ?? SYSTEM_CONST.ERRORS.FETCH_DROPDOWN]);
                  return;
                }

                const rawItems = getGetResponseItems(response);
                const list = mapData
                  ? mapData(rawItems)
                  : normalizeGetDropdownData(response as IApiResponse<ITextValueOption[]>);
                setSuccess(key, list, rawItems);
              },
              error: (err) => setError(key, toErrorList(err)),
            })
          );
        })
      )
    );

    const postDropdownRequest = rxMethod<DropdownPostRequest>(
      pipe(
        tap(({ key, force, mapData }) => {
          if (hasCachedData(key) && !force) {
            const raw = store.rawData()[key];
            if (Array.isArray(raw) && raw.length > 0 && mapData) {
              const list = mapData(raw);
              setSuccess(key, list, raw);
            }
            return;
          }
          setLoading(key);
        }),
        mergeMap(({ key, endpoint, body, params, force, mapData }) => {
          if (hasCachedData(key) && !force) return EMPTY;

          return http.post<IApiResponse<any[] | IDataTableResponse<any>>, any>(
            endpoint,
            (body ?? defaultDropdownPostBody) as object,
            params
          ).pipe(
            tapResponse({
              next: (response) => {
                if (!isHttpSuccess(response?.statusCode)) {
                  setError(key, [response?.message ?? SYSTEM_CONST.ERRORS.FETCH_DROPDOWN]);
                  return;
                }

                const rawItems = getPostResponseItems(response);
                const list = mapData(rawItems);
                setSuccess(key, list, rawItems);
              },
              error: (err) => setError(key, toErrorList(err)),
            })
          );
        })
      )
    );

    return ({
      getDropdownObservable<T = any>(request: DropdownRequest<T>): Observable<ITextValueOption[]> {
        const { key, endpoint, params, force, mapData } = request;

        if (hasCachedData(key) && !force) {
          const raw = store.rawData()[key];
          if (Array.isArray(raw) && raw.length > 0 && mapData) {
            const list = mapData(raw);
            setSuccess(key, list, raw);
            return of(list);
          } else {
            return of(store.data()[key]);
          }
        }

        setLoading(key);

        return http.get<IApiResponse<any[]>, any>(endpoint, params).pipe(
          map((response) => {
            if (!isHttpSuccess(response?.statusCode)) {
              setError(key, [response?.message ?? SYSTEM_CONST.ERRORS.FETCH_DROPDOWN]);
              return [];
            }

            const rawItems = getGetResponseItems<T>(response);
            const list = mapData
              ? mapData(rawItems)
              : normalizeGetDropdownData(response as IApiResponse<ITextValueOption[]>);
            setSuccess(key, list, rawItems);
            return list;
          }),
          catchError((err) => {
            setError(key, toErrorList(err));
            return of([]);
          })
        );
      },

      getDropdown<T = any>(request: DropdownRequest<T>): void {
        getDropdownRequest(request as DropdownRequest);
      },

      postDropdown<T = any>(request: DropdownPostRequest<T>): void {
        postDropdownRequest(request as DropdownPostRequest);
      },

      getList(key: string): Signal<ITextValueOption[]> {
        return computed(() => {
          const hasError = (store.error()[key]?.length ?? 0) > 0;
          if (hasError) return [];
          return store.data()[key] ?? [];
        });
      },

      isLoading(key: string): Signal<boolean> {
        return computed(() => store.loading()[key] ?? false);
      },

      getError(key: string): Signal<string | null> {
        return computed(() => {
          const errorEntry = store.error()[key];
          if (!errorEntry?.length) return null;
          const firstError = errorEntry[0];
          return typeof firstError === 'string' ? firstError : JSON.stringify(firstError);
        });
      },

      resetKey(key: string): void {
        patchState(store, {
          data: { ...store.data(), [key]: [] },
          rawData: { ...store.rawData(), [key]: [] },
          loading: { ...store.loading(), [key]: false },
          error: { ...store.error(), [key]: [] },
        });
      },

      resetKeys(keys: string[]): void {
        const data = { ...store.data() };
        const rawData = { ...store.rawData() };
        const loading = { ...store.loading() };
        const error = { ...store.error() };

        keys.forEach(key => {
          data[key] = [];
          rawData[key] = [];
          loading[key] = false;
          error[key] = [];
        });

        patchState(store, { data, rawData, loading, error });
      },

      resetState(): void {
        patchState(store, initialState);
      },
    });
  })
);

