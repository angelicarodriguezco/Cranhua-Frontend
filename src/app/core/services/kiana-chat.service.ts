import { Injectable } from '@angular/core';
import { Observable, of, switchMap, throwError, timer } from 'rxjs';

import {
  DELAY_RESPUESTA_KIANA_MS,
  ErrorKiana,
  INTERVALO_FALLO_KIANA,
  MAX_LONGITUD_MENSAJE_KIANA,
  MENSAJE_ERROR_KIANA,
  RESPUESTAS_EJEMPLO_KIANA,
  RespuestaKiana,
} from '../models/kiana-chat.model';

@Injectable({ providedIn: 'root' })
export class KianaChatService {
  readonly delayMs = DELAY_RESPUESTA_KIANA_MS;

  private contadorEnvios = 0;
  private indiceRespuesta = 0;

  enviarMensaje(texto: string): Observable<RespuestaKiana> {
    const mensaje = texto.trim().slice(0, MAX_LONGITUD_MENSAJE_KIANA);
    if (!mensaje) {
      return throwError(() => ({ mensaje: MENSAJE_ERROR_KIANA }) satisfies ErrorKiana);
    }

    return timer(this.delayMs).pipe(
      switchMap(() => {
        this.contadorEnvios += 1;

        if (this.contadorEnvios % INTERVALO_FALLO_KIANA === 0) {
          return throwError(() => ({ mensaje: MENSAJE_ERROR_KIANA }) satisfies ErrorKiana);
        }

        const textoRespuesta =
          RESPUESTAS_EJEMPLO_KIANA[this.indiceRespuesta % RESPUESTAS_EJEMPLO_KIANA.length];
        this.indiceRespuesta += 1;
        return of({ texto: textoRespuesta });
      }),
    );
  }
}
