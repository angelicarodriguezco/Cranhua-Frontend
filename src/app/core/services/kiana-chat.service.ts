import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
  KianaChatRequestApi,
  KianaChatResponseApi,
  MAX_LONGITUD_MENSAJE_KIANA,
  MENSAJE_ERROR_KIANA,
  MensajeKiana,
  RolMensajeKiana,
  SALUDO_KIANA,
} from '../models/kiana-chat.model';

export function mensajeErrorKiana(error: unknown): string {
  if (!(error instanceof HttpErrorResponse) || error.status === 0) {
    return MENSAJE_ERROR_KIANA;
  }
  const cuerpo = error.error as { mensaje?: unknown; errores?: Record<string, unknown> } | null;
  const errorCampo = cuerpo?.errores ? Object.values(cuerpo.errores)[0] : undefined;
  if (typeof errorCampo === 'string' && errorCampo.trim()) {
    return errorCampo;
  }
  if (typeof cuerpo?.mensaje === 'string' && cuerpo.mensaje.trim()) {
    return cuerpo.mensaje;
  }
  return MENSAJE_ERROR_KIANA;
}

@Injectable({ providedIn: 'root' })
export class KianaChatService {
  private readonly http = inject(HttpClient);
  private readonly lista = signal<MensajeKiana[]>([]);
  private readonly esperando = signal(false);
  private conversationId: string | null = null;
  private contadorIds = 0;

  readonly mensajes = this.lista.asReadonly();
  readonly pensando = this.esperando.asReadonly();

  private get url(): string {
    return `${environment.apiUrl}/api/ai/chat`;
  }

  iniciar(): void {
    if (this.lista().length === 0) {
      this.agregar('kiana', SALUDO_KIANA);
    }
  }

  enviar(texto: string): void {
    const mensaje = texto.trim().slice(0, MAX_LONGITUD_MENSAJE_KIANA);
    if (this.esperando() || !mensaje) {
      return;
    }

    this.iniciar();
    this.agregar('usuario', mensaje);
    this.esperando.set(true);

    const cuerpo: KianaChatRequestApi = { message: mensaje, conversationId: this.conversationId };
    this.http.post<KianaChatResponseApi>(this.url, cuerpo).subscribe({
      next: (respuesta) => {
        this.conversationId = respuesta.conversationId;
        this.esperando.set(false);
        this.agregar('kiana', respuesta.reply);
      },
      error: (error: unknown) => {
        this.esperando.set(false);
        this.agregar('error', mensajeErrorKiana(error));
      },
    });
  }

  private agregar(rol: RolMensajeKiana, texto: string): void {
    this.contadorIds += 1;
    const nuevo: MensajeKiana = {
      id: `kiana-msg-${this.contadorIds}`,
      rol,
      texto,
      creadoEn: Date.now(),
    };
    this.lista.update((actuales) => [...actuales, nuevo]);
  }
}
