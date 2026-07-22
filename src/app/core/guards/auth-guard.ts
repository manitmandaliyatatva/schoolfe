import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CommonHelperService } from '../services/common-helper.service';
import { AuthStore } from '../store/auth.store';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const publicGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const commonService = inject(CommonHelperService)


  if (authStore.isLoggedIn()) {
    commonService.redirectToDashboard();
    return false;
  }

  return true;
};
