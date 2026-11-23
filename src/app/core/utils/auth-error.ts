import { HttpErrorResponse } from '@angular/common/http';

import { ErrorAuth } from '../models/auth.model';

const MENSAJE_GENERICO = 'No se pudo completar la solicitud. Intentá de nuevo.';

export function parsearErrorAuth(error: unknown): ErrorAuth {
  if (!(error instanceof HttpErrorResponse)) {
    return { mensaje: MENSAJE_GENERICO };
  }

  const cuerpo = error.error;
  if (cuerpo && typeof cuerpo === 'object' && 'mensaje' in cuerpo) {
    const mensaje = String((cuerpo as { mensaje: unknown }).mensaje || MENSAJE_GENERICO);
    const errores = (cuerpo as { errores?: Record<string, string> }).errores;
    return {
      mensaje,
      errores: errores && typeof errores === 'object' ? errores : undefined,
    };
  }

  return { mensaje: MENSAJE_GENERICO };
}

/** Los errores por campo del backend en una sola línea; si no hay, el mensaje general. */
export function mensajeDeError(error: unknown): string {
  const { mensaje, errores } = parsearErrorAuth(error);
  const porCampo = Object.values(errores ?? {});
  return porCampo.length > 0 ? porCampo.join(' ') : mensaje;
}
