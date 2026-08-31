import { Injectable, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { setSkipRedirectNavigation } from '../msal/msal.config';

@Injectable({ providedIn: 'root' })
export class MsalAuthService {
  private msalService = inject(MsalService);

  loginWithMicrosoft(): void {
    this.msalService.loginRedirect();
  }

  // Cierra la sesión SOLO dentro de esta app.
  // MSAL limpia el caché local igual, pero no navega al endpoint de logout de Microsoft.
  logout(): Promise<void> {
    setSkipRedirectNavigation(true);
    return this.msalService.instance.logoutRedirect({ postLogoutRedirectUri: '/' });
  }

  // Cierra sesión en TODO (Microsoft global) - por si en algún caso lo necesitas explícitamente
  logoutGlobal(): void {
    this.msalService.logoutRedirect({ postLogoutRedirectUri: '/' });
  }

  isLoggedIn(): boolean {
    return this.msalService.instance.getAllAccounts().length > 0;
  }

  getUser() {
    const account = this.msalService.instance.getAllAccounts()[0];
    return account ? { name: account.name, email: account.username } : null;
  }
}