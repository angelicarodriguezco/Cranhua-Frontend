import {
  ACCEPT_IMAGEN_PERFIL,
  TAMANO_MAXIMO_IMAGEN_BYTES,
  TIPOS_IMAGEN_PERMITIDOS,
  validarImagenPerfil,
} from './imagen';

function archivo(nombre: string, tipo: string, bytes: number): File {
  return new File([new Uint8Array(bytes)], nombre, { type: tipo });
}

describe('imagen', () => {
  it('expone los tipos permitidos y el accept del input', () => {
    expect(TIPOS_IMAGEN_PERMITIDOS).toEqual(['image/jpeg', 'image/png', 'image/webp']);
    expect(ACCEPT_IMAGEN_PERFIL).toBe('image/jpeg,image/png,image/webp');
    expect(TAMANO_MAXIMO_IMAGEN_BYTES).toBe(5 * 1024 * 1024);
  });

  it('acepta JPG, PNG y WebP dentro del límite', () => {
    expect(validarImagenPerfil(archivo('a.jpg', 'image/jpeg', 1024))).toBeNull();
    expect(validarImagenPerfil(archivo('a.png', 'image/png', 1024))).toBeNull();
    expect(validarImagenPerfil(archivo('a.webp', 'image/webp', 1024))).toBeNull();
    expect(
      validarImagenPerfil(archivo('limite.jpg', 'image/jpeg', TAMANO_MAXIMO_IMAGEN_BYTES)),
    ).toBeNull();
  });

  it('rechaza tipos que no son JPG/PNG/WebP', () => {
    expect(validarImagenPerfil(archivo('a.gif', 'image/gif', 100))).toBe(
      'Solo se permiten imágenes JPG, PNG o WebP.',
    );
    expect(validarImagenPerfil(archivo('a.bmp', 'image/bmp', 100))).toBe(
      'Solo se permiten imágenes JPG, PNG o WebP.',
    );
    expect(validarImagenPerfil(archivo('a.pdf', 'application/pdf', 100))).toBe(
      'Solo se permiten imágenes JPG, PNG o WebP.',
    );
  });

  it('rechaza archivos mayores a 5 MB', () => {
    expect(
      validarImagenPerfil(archivo('grande.jpg', 'image/jpeg', TAMANO_MAXIMO_IMAGEN_BYTES + 1)),
    ).toBe('La imagen no puede superar 5 MB.');
  });
});
