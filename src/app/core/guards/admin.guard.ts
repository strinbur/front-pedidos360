import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MsalAuthService } from '../msal-auth/msal-auth.service';

export const adminGuard: CanActivateFn = () => {
  const msalAuthService = inject(MsalAuthService);
  const router = inject(Router);

  if (msalAuthService.isLoggedIn() && msalAuthService.hasRole('ADMIN')) {
    return true;
  }

  router.navigate(['/']);
  return false;
};