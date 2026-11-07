import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import {
  DELAY_RESPUESTA_KIANA_MS,
  ErrorKiana,
  INTERVALO_FALLO_KIANA,
  MAX_LONGITUD_MENSAJE_KIANA,
  MENSAJE_ERROR_KIANA,
  RESPUESTAS_EJEMPLO_KIANA,
} from '../models/kiana-chat.model';
import { KianaChatService } from './kiana-chat.service';

describe('KianaChatService', () => {
  let servicio: KianaChatService;

  beforeEach(() => {
    servicio = TestBed.inject(KianaChatService);
  });

  it('responde tras el delay con una frase de ejemplo', fakeAsync(() => {
    let texto: string | undefined;
    let error: unknown;

    servicio.enviarMensaje('Hola').subscribe({
      next: (r) => (texto = r.texto),
      error: (e) => (error = e),
    });

    expect(texto).toBeUndefined();
    tick(DELAY_RESPUESTA_KIANA_MS - 1);
    expect(texto).toBeUndefined();

    tick(1);
    expect(error).toBeUndefined();
    expect(texto).toBe(RESPUESTAS_EJEMPLO_KIANA[0]);
  }));

  it('rota las respuestas de ejemplo en envíos exitosos', fakeAsync(() => {
    const recibidas: string[] = [];

    for (let i = 0; i < RESPUESTAS_EJEMPLO_KIANA.length; i++) {
      servicio.enviarMensaje(`msg-${i}`).subscribe({
        next: (r) => recibidas.push(r.texto),
      });
      tick(DELAY_RESPUESTA_KIANA_MS);
    }

    expect(recibidas).toEqual([...RESPUESTAS_EJEMPLO_KIANA]);
  }));

  it(`falla cada ${INTERVALO_FALLO_KIANA}.º mensaje con el copy de error`, fakeAsync(() => {
    const errores: ErrorKiana[] = [];
    const exitos: string[] = [];

    for (let i = 1; i <= INTERVALO_FALLO_KIANA; i++) {
      servicio.enviarMensaje(`intento-${i}`).subscribe({
        next: (r) => exitos.push(r.texto),
        error: (e: ErrorKiana) => errores.push(e),
      });
      tick(DELAY_RESPUESTA_KIANA_MS);
    }

    expect(exitos.length).toBe(INTERVALO_FALLO_KIANA - 1);
    expect(errores).toEqual([{ mensaje: MENSAJE_ERROR_KIANA }]);
  }));

  it(`acepta mensajes de hasta ${MAX_LONGITUD_MENSAJE_KIANA} caracteres y rechaza vacíos`, fakeAsync(() => {
    let ok = false;
    let errorVacio: ErrorKiana | undefined;

    servicio.enviarMensaje('x'.repeat(MAX_LONGITUD_MENSAJE_KIANA + 50)).subscribe({
      next: () => (ok = true),
    });
    tick(DELAY_RESPUESTA_KIANA_MS);
    expect(ok).toBeTrue();

    servicio.enviarMensaje('   ').subscribe({
      error: (e: ErrorKiana) => (errorVacio = e),
    });
    expect(errorVacio).toEqual({ mensaje: MENSAJE_ERROR_KIANA });
  }));
});
