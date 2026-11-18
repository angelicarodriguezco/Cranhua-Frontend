export const MAX_LONGITUD_MENSAJE_KIANA = 500;

export const SALUDO_KIANA = '¡Hola! Soy Kiana ¿En qué te puedo ayudar hoy?';

export const MENSAJE_ERROR_KIANA = 'Uy, algo salió mal. Intentá de nuevo en un momento.';

export const CHIPS_SUGERIDOS_KIANA = [
  '¿Cómo registro mi finca?',
  'Cafeterias en Guanacaste',
] as const;

export type RolMensajeKiana = 'usuario' | 'kiana' | 'error';

export interface MensajeKiana {
  id: string;
  rol: RolMensajeKiana;
  texto: string;
  creadoEn: number;
}

export interface KianaChatRequestApi {
  message: string;
  conversationId: string | null;
}

export interface KianaChatResponseApi {
  reply: string;
  conversationId: string;
}
