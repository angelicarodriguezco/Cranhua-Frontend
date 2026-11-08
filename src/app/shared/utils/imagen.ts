export const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const TAMANO_MAXIMO_IMAGEN_BYTES = 5 * 1024 * 1024;

export const ACCEPT_IMAGEN_PERFIL = TIPOS_IMAGEN_PERMITIDOS.join(',');

export function validarImagenPerfil(archivo: File): string | null {
  if (!(TIPOS_IMAGEN_PERMITIDOS as readonly string[]).includes(archivo.type)) {
    return 'Solo se permiten imágenes JPG, PNG o WebP.';
  }
  if (archivo.size > TAMANO_MAXIMO_IMAGEN_BYTES) {
    return 'La imagen no puede superar 5 MB.';
  }
  return null;
}
