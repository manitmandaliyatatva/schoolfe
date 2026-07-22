import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, pipe } from 'rxjs';
import { catchError, finalize, tap, switchMap } from 'rxjs/operators';
import { APP_CONSTANTS, HTTP_ERROR_CODES, HTTP_ERROR_MESSAGES } from '../../shared/constants/app.constants';
import { ApiResponse } from '../models/responce.model';
import { LoaderService } from '../services/loader.service';
import { ToastrHelperService } from '../services/toster-helper.service';
import { AuthStore } from '../store/auth.store';
import { PublicLoaderService } from '../services/public-loader.service';
import { API } from '../../shared/constants/api-url';
import { INTERCEPTOR_CONFIG } from './interceptor.config';

export const BaseInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
): Observable<HttpEvent<any>> => {
  const toaster = inject(ToastrHelperService);
  const loader = inject(LoaderService);
  const publicLoader = inject(PublicLoaderService);
  const authStore = inject(AuthStore);

  const isRetry = req.headers.has('X-Token-Retry');
  const cleanedReq = isRetry ? req.clone({ headers: req.headers.delete('X-Token-Retry') }) : req;

  const token = authStore.accessToken();
  const academicYearId = authStore.academicyearid();
  const branchId = authStore.branchid();

  const headers: any = {};
  if (token) {
    headers['Authorization'] = `${APP_CONSTANTS.KEYS.TOKEN_SCHEMA}${token}`;
  }
  if (academicYearId) {
    headers['X-Academic-Year-Id'] = academicYearId;
  }
  if (branchId) {
    headers['X-Branch-Id'] = branchId;
  }

  const authReq = cleanedReq.clone({
    setHeaders: headers
  });

  const isBackgroundRequest = INTERCEPTOR_CONFIG.BACKGROUND_REQUESTS.some(url => cleanedReq.url.includes(url));
  const isPublicRequest = INTERCEPTOR_CONFIG.PUBLIC_REQUESTS.some(url => req.url.includes(url));

  if (isPublicRequest) {
    publicLoader.show();
  } else if (!isBackgroundRequest) {
    loader.show();
  }

  const handleResponse = () => pipe(
    tap((event: HttpEvent<any>) => {
      if (event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
        const body = event.body as ApiResponse<any>;

        // ✅ Handle 200 OK but isSuccess: false (e.g. soft validation errors)
        if (body?.isSuccess === false) {
          const errors: string[] = Array.isArray(body.errors) ? body.errors : [];
          const errorMessage =
            errors.length > 0
              ? errors.join('\n')
              : body?.message || HTTP_ERROR_MESSAGES.DEFAULT;
          toaster.showErrorMessage(errorMessage);
          return;
        }

        const message = body?.message;
        const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
        const isSilentApi = INTERCEPTOR_CONFIG.SILENT_API_KEYWORDS.some(k => cleanedReq.url.includes(k)) || 
                            INTERCEPTOR_CONFIG.SILENT_API_ENDPOINTS.some(url => cleanedReq.url.toLowerCase().includes(url.toLowerCase())) ||
                            INTERCEPTOR_CONFIG.SILENT_API_KEYWORDS_LOWERCASE.some(k => cleanedReq.url.toLowerCase().includes(k));

        if (message && writeMethods.includes(cleanedReq.method) && !isSilentApi && !isBackgroundRequest && !isPublicRequest) {
          toaster.showSuccessMessage(message);
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      let errorMessage = HTTP_ERROR_MESSAGES.DEFAULT;

      if (error.error instanceof ErrorEvent) {
        // Client-side / network error
        errorMessage = error.error.message;
      } else {
        const status = error.status;

        // ✅ 500 and 404 use their own message (different response shape)
        if (status === HTTP_ERROR_CODES.NOT_FOUND || status === HTTP_ERROR_CODES.INTERNAL_SERVER_ERROR) {
          const apiErrors: string[] = Array.isArray(error.error?.errors) ? error.error.errors : [];

          if (apiErrors.length > 0) {
            apiErrors.forEach(msg => toaster.showErrorMessage(msg));
          } else {
            const backendMessage =
              (typeof error.error === 'string' ? error.error : null) ||
              error.error?.message ||
              error.error?.title ||
              null;

            errorMessage =
              status === HTTP_ERROR_CODES.NOT_FOUND
                ? backendMessage || HTTP_ERROR_MESSAGES.NOT_FOUND
                : backendMessage || HTTP_ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

            toaster.showErrorMessage(errorMessage);
          }
        } else {
          // ✅ All other status codes share the same ApiResponse shape
          const isLoginRequest = cleanedReq.url.includes(API.AUTH.LOGIN);
          if (status !== HTTP_ERROR_CODES.UNAUTHORIZED || isLoginRequest) {
            const apiErrors: string[] | undefined = error.error?.errors;

            if (Array.isArray(apiErrors) && apiErrors.length > 0) {
              apiErrors.forEach((element) => {
                toaster.showErrorMessage(element);
              });
            } else {
              // Fallback if errors array is missing/empty
              errorMessage =
                error.error?.message ||
                error.error?.title ||
                (typeof error.error === 'string' ? error.error : null) ||
                HTTP_ERROR_MESSAGES.DEFAULT;
              toaster.showErrorMessage(errorMessage);
            }
          }

          // ✅ Handle 401 redirect / Token Refresh
          if (status === HTTP_ERROR_CODES.UNAUTHORIZED) {
            if (cleanedReq.url.includes(API.AUTH.REFRESH_TOKEN) || isRetry || isLoginRequest) {
              if (isLoginRequest) {
                return throwError(() => ({
                  status: error.status,
                  message: errorMessage,
                  originalError: error,
                }));
              }
              const apiErrors: string[] | undefined = error.error?.errors;
              if (Array.isArray(apiErrors) && apiErrors.length > 0) {
                apiErrors.forEach((element) => {
                  toaster.showErrorMessage(element);
                });
              }
              authStore.frontendLogout();
              return throwError(() => ({
                status: error.status,
                message: HTTP_ERROR_MESSAGES.UNAUTHORIZED,
                originalError: error,
              }));
            } else {
              // Trigger refresh and retry
              return authStore.refreshAccessToken().pipe(
                switchMap((newToken) => {
                  const retriedReq = cleanedReq.clone({
                    setHeaders: {
                      Authorization: `${APP_CONSTANTS.KEYS.TOKEN_SCHEMA}${newToken}`,
                      'X-Token-Retry': 'true',
                    },
                  });
                  return next(retriedReq).pipe(
                    handleResponse()
                  );
                })
              );
            }
          }
        }
      }

      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        originalError: error,
      }));
    })
  );

  return next(authReq).pipe(
    handleResponse(),
    finalize(() => {
      if (isPublicRequest) {
        publicLoader.hide();
      } else if (!isBackgroundRequest) {
        loader.hide();
      }
    }),
  );
};
