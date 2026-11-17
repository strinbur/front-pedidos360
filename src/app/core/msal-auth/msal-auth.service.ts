import { Injectable, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { PRODUCT_API_SCOPE, setSkipRedirectNavigation } from '../msal/msal.config';

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

  hasRole(role: string): boolean {
    const account = this.msalService.instance.getAllAccounts()[0];
    const roles = (account?.idTokenClaims as any)?.['roles'] as string[] | undefined;
    return roles?.includes(role) ?? false;
  }

  // Token de acceso para nuestra API (lo usan las estadísticas y el SSE, que van con fetch).
  // Si el token venció y no se puede renovar en silencio, MSAL redirige a iniciar sesión.
  async getApiToken(): Promise<string> {
    const account = this.msalService.instance.getAllAccounts()[0];
    if (!account) {
      throw new Error('Sin sesión activa');
    }
    try {
      const result = await this.msalService.instance.acquireTokenSilent({
        scopes: [PRODUCT_API_SCOPE],
        account
      });
      return result.accessToken;
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) {
        await this.msalService.instance.acquireTokenRedirect({
          scopes: [PRODUCT_API_SCOPE],
          account
        });
      }
      throw e;
    }
  }
}