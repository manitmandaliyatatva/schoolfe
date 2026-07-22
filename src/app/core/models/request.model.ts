import { Role } from "../../features/auth/auth.model";
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

export interface SearchRequestModel {
  sortField?: string;
  sortOrder?: 'asc' | 'desc' | '';
  searchText?: string;
}

export interface PageRequest extends SearchRequestModel {
  pageIndex: number;
  pageSize: number;
}

export interface IPaginationRequest {
  pageIndex: number;
  pageSize: number;
  generalSearch: string;
  defaultSortingColumn: string;
  sortOrder: 'asc' | 'desc' | '';
  columns?: IColumns[]
}
export interface IColumns {
  name: string,
  filterSearch: FilterSearch
}
export interface FilterSearch {
  value: string,
  condition?: FilterCondition
}
export enum FilterCondition {
  Equals = 0,
  NotEquals = 1,
  Contains = 2,
  StartsWith = 3,
  EndsWith = 4
}

export const defaultPagination = (): IPaginationRequest => ({
  pageIndex: 0,
  pageSize: 10,
  generalSearch: '',
  defaultSortingColumn: '',
  sortOrder: ''
});

export interface IGetAllRequest<B = IPaginationRequest> {
  endpoint: string;
  body?: B;        // ✅ optional body for POST-based GET
  params?: Record<string, any>;
}

export interface IGetByIdRequest {
  endpoint: string;
  id?: string | number;
  params?: Record<string, any>;
}

export interface ICreateRequest<T> {
  endpoint: string;
  body: T;
}

export interface IUpdateRequest<T> {
  endpoint: string;
  body?: T;
  idKey?: string;
  params?: Record<string, any>;
}

export interface IDeleteRequest {
  endpoint: string;
  id?: number | string;
  idKey?: string;
  params?: Record<string, any>;
}

export interface IApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface IDataTableResponse<T> {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: T[];
  error: string | null;
}

export interface IDataTableResponseWithKpi<T, K> extends IDataTableResponse<T> {
  kpiData?: K;
}

export type IGetAllResponse<T> = IApiResponse<IDataTableResponse<T>>;

export interface IApiState<T> {
  data: T | null;
  list: T[];
  totalRecords: number;
  recordsFiltered: number;
  draw: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  isSuccess: boolean;
}

export const initialApiState = <T>(): IApiState<T> => ({
  data: null,
  list: [],
  totalRecords: 0,
  recordsFiltered: 0,
  draw: 0,
  isLoading: false,
  isSubmitting: false,
  error: null,
  isSuccess: false
});

export interface IDecodedToken {
  identifier: string;
  entityid: string;
  email: string;
  name: string;
  usertype: Role;
  exp: number;
  iss: string;
  aud: string;
}
