import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GooglePromptNotification {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  prompt(momentListener?: (notification: GooglePromptNotification) => void): void;
  cancel(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const SCRIPT_GIS = 'https://accounts.google.com/gsi/client';

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private scriptCargado: Promise<void> | null = null;

  obtenerCredencial(): Promise<string> {
    const clientId = environment.googleClientId;
    if (!clientId) {
      return Promise.reject(new Error('Falta configurar GOOGLE_CLIENT_ID.'));
    }

    return this.asegurarScript().then(
      () =>
        new Promise<string>((resolve, reject) => {
          const googleId = window.google?.accounts?.id;
          if (!googleId) {
            reject(new Error('Google Identity Services no está disponible.'));
            return;
          }

          let cerrado = false;
          const terminar = (accion: () => void) => {
            if (cerrado) {
              return;
            }
            cerrado = true;
            accion();
          };

          googleId.cancel();
          googleId.initialize({
            client_id: clientId,
            auto_select: false,
            cancel_on_tap_outside: true,
            callback: (response) => {
              terminar(() => {
                if (response.credential) {
                  resolve(response.credential);
                } else {
                  reject(new Error('No se recibió la credencial de Google.'));
                }
              });
            },
          });

          googleId.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              terminar(() =>
                reject(
                  new Error(
                    'No se pudo abrir el inicio de sesión con Google. Probá de nuevo o usá correo.',
                  ),
                ),
              );
            }
          });
        }),
    );
  }

  private asegurarScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }
    if (!this.scriptCargado) {
      this.scriptCargado = new Promise<void>((resolve, reject) => {
        const existente = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_GIS}"]`);
        if (existente) {
          existente.addEventListener('load', () => resolve(), { once: true });
          existente.addEventListener(
            'error',
            () => reject(new Error('No se pudo cargar Google Identity Services.')),
            { once: true },
          );
          return;
        }

        const script = document.createElement('script');
        script.src = SCRIPT_GIS;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services.'));
        document.head.appendChild(script);
      });
    }
    return this.scriptCargado;
  }
}
