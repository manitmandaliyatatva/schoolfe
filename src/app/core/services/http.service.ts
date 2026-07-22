import { HttpClient, HttpContext, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private _header: HttpHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private _http: HttpClient) { }

  public get<T, U>(url: string, params?: U, header?: HttpHeaders, context?: HttpContext, responseType: 'json' | 'blob' | 'text' = 'json'): Observable<T> {
    header = header ?? this._header;
    const httpParams = this.convertParams<U>(params ?? {} as U);
    return this._http.get<T>(url, { headers: header, params: httpParams, context: context, responseType: responseType as any });
  }

  public getById<T, U>(url: string, id: string, params?: U, header?: HttpHeaders, context?: HttpContext,): Observable<T> {
    const httpParams = this.convertParams<U>(params ?? {} as U);
    return this._http.get<T>(`${url}/${id}`, { headers: header, context: context, params: httpParams });
  }

  public post<T, U>(url: string, body: object, params?: U, header?: HttpHeaders, context?: HttpContext): Observable<T> {
    header = header ?? this._header;
    const httpParams = this.convertParams<U>(params ?? {} as U);
    return this._http.post<T>(url, body, { headers: header, params: httpParams, context: context });
  }

  public put<T, U>(url: string, body?: object, params?: U, header?: HttpHeaders, context?: HttpContext): Observable<T> {
    header = header ?? this._header;
    const httpParams = this.convertParams<U>(params ?? {} as U);
    return this._http.put<T>(url, body, { headers: header, params: httpParams, context: context });
  }

  public delete<T, U>(url: string, requestBody?: object, params?: U, header?: object, context?: HttpContext): Observable<T> {
    const httpParams = this.convertParams<U>(params ?? {} as U);
    const options = {
      header: header ?? this._header,
      body: requestBody,
      params: httpParams,
      context: context
    };
    return this._http.request<T>('delete', url, options);
  }

  convertParams<T>(params: T): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      for (const key of Object.keys(params))
        httpParams = httpParams.set(key, (params as any)[key]?.toString());
    }
    return httpParams;
  }
}
