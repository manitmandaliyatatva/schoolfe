import { HttpInterceptorFn, HttpRequest } from "@angular/common/http";
import { BASE_API_URL } from "../../shared/constants/api-url";
import { AuthStore } from "../store/auth.store";
import { inject } from "@angular/core";
import { HTTP_HTTPS_REGEX } from "../../shared/constants/app.constants";

export const ApiPrefixInterceptor: HttpInterceptorFn = (request, next) => {
  const authStore = inject(AuthStore);
  authStore.accessToken;
  if (!HTTP_HTTPS_REGEX.test(request.url) && !request.url.includes('assets/')) {
    request = request.clone({ url: BASE_API_URL + request.url });
    request = cloneRequestWithNewToken(request,(authStore.accessToken() as string));
  }
  return next(request);
};

function cloneRequestWithNewToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({ headers: request.headers.set('Authorization', `Bearer ${token}`) });
}