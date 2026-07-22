import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { BaseInterceptor } from './core/interceptors/base-interceptor';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { ApiPrefixInterceptor } from './core/interceptors/api-prefix.interceptor';
import { provideToastr } from 'ngx-toastr';
import { provideNgxMask } from 'ngx-mask';
import { provideNgxStripe } from 'ngx-stripe';
import { OVERLAY_DEFAULT_CONFIG } from '@angular/cdk/overlay';
import { environment } from '../environments/environment';
import { PublicSettingStore } from './core/store/public-setting.store';
import { AuthStore } from './core/store/auth.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideToastr(),
    provideNgxStripe(environment.stripePublishableKey),
    provideNgxMask(),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),  // Preload lazy routes in background
    ),
    provideHttpClient(  
      withInterceptorsFromDi(),
      withInterceptors([BaseInterceptor,ApiPrefixInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: (store: any) => () => store.loadSettings(),
      deps: [PublicSettingStore],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (authStore: any) => () => {
        return new Promise<void>((resolve) => {
          authStore.fetchUserContext(resolve);
        });
      },
      deps: [AuthStore],
      multi: true
    },
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      },
    },
    {
      provide: OVERLAY_DEFAULT_CONFIG,
      useValue: { usePopover: false }
    },
  ],
};
