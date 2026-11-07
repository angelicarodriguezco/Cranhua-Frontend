export const MAX_LONGITUD_MENSAJE_KIANA = 500;

export const DELAY_RESPUESTA_KIANA_MS = 1200;

export const INTERVALO_FALLO_KIANA = 4;

export const SALUDO_KIANA = '¡Hola! Soy Kiana ¿En qué te puedo ayudar hoy?';

export const MENSAJE_ERROR_KIANA = 'Uy, algo salió mal. Intentá de nuevo en un momento.';

export const CHIPS_SUGERIDOS_KIANA = [
  '¿Cómo registro mi finca?',
  'Cafeterias en Guanacaste',
] as const;

export const RESPUESTAS_EJEMPLO_KIANA = [
  'Es el código único que se genera para cada tueste. Con él podés ver la finca, el proceso y quién tostó ese café, sin necesidad de crear una cuenta.',
  'Podés registrar tu finca desde el panel del cafetalero, en la sección Mis fincas.',
  'En Explorar podés buscar cafeterías por zona y ver su perfil y menú público.',
] as const;

export type RolMensajeKiana = 'usuario' | 'kiana' | 'error';

export interface MensajeKiana {
  id: string;
  rol: RolMensajeKiana;
  texto: string;
  creadoEn: number;
}

export interface RespuestaKiana {
  texto: string;
}

export interface ErrorKiana {
  mensaje: string;
}
