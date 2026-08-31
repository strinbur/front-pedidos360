import { PublicClientApplication, InteractionType, BrowserCacheLocation } from '@azure/msal-browser';
import { MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';

// Bandera de un solo uso: controla si la próxima navegación de redirect debe omitirse
// (se usa para el logout "local", que no debe mandarte al endpoint de logout de Microsoft)
let skipNextRedirectNavigation = false;

export function setSkipRedirectNavigation(skip: boolean): void {
  skipNextRedirectNavigation = skip;
}

export function MSALInstanceFactory(): PublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '8d14a1ab-3758-45e4-b409-a95f6b7442e3',
      authority: 'https://login.microsoftonline.com/f2a31af8-f420-417d-b585-34f31769c272',
      redirectUri: 'http://localhost:4200',
      onRedirectNavigate: () => {
        if (skipNextRedirectNavigation) {
          skipNextRedirectNavigation = false; // se resetea automáticamente para la próxima vez
          return false; // no navega a Microsoft: logout queda solo local
        }
        return true; // comportamiento normal (login y logout global)
      }
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage
    }
  });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: ['user.read']
    }
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', ['user.read']);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}