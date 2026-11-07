import { normalizarRutaKiana, rutaMuestraKiana } from './ruta-muestra-kiana';

describe('rutaMuestraKiana', () => {
  it('normaliza query, hash y barra final', () => {
    expect(normalizarRutaKiana('/explorar?x=1')).toBe('/explorar');
    expect(normalizarRutaKiana('/explorar#seccion')).toBe('/explorar');
    expect(normalizarRutaKiana('/perfil/')).toBe('/perfil');
    expect(normalizarRutaKiana('/')).toBe('/');
  });

  it('oculta las rutas de la denylist', () => {
    const ocultas = [
      '/',
      '/iniciar-sesion',
      '/registro',
      '/recuperar-contrasena',
      '/onboarding-finca',
      '/onboarding-tostador',
      '/onboarding-cafeteria',
      '/perfil',
      '/perfil/?tab=datos',
      '/iniciar-sesion?returnUrl=/explorar',
    ];

    for (const url of ocultas) {
      expect(rutaMuestraKiana(url)).withContext(url).toBeFalse();
    }
  });

  it('muestra el widget en el resto de rutas', () => {
    const visibles = [
      '/explorar',
      '/explorar/finca/1',
      '/explorar/tostador/1',
      '/explorar/cafeteria/1',
      '/explorar/cafeteria/1/menu',
      '/cafetalero/dashboard',
      '/tostador/cosechas',
      '/cafeteria/dashboard',
      '/mapa-prueba',
    ];

    for (const url of visibles) {
      expect(rutaMuestraKiana(url)).withContext(url).toBeTrue();
    }
  });
});
