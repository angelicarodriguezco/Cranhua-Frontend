import { CuentaResponseApi } from '../models/auth.model';
import {
  aActualizarCuentaRequest,
  etiquetaRoles,
  mapearCuentaResponseACuenta,
  mapearCuentaResponseAPerfil,
  mapearRedesDesdeApi,
  mapearRedesHaciaApi,
  mapearTipoRedDesdeApi,
  mapearTipoRedHaciaApi,
} from './cuenta.mapper';

describe('cuenta.mapper', () => {
  it('mapea tipos de red UI ↔ API (sitio ↔ SITIO_WEB y casing)', () => {
    expect(mapearTipoRedHaciaApi('instagram')).toBe('INSTAGRAM');
    expect(mapearTipoRedHaciaApi('whatsapp')).toBe('WHATSAPP');
    expect(mapearTipoRedHaciaApi('facebook')).toBe('FACEBOOK');
    expect(mapearTipoRedHaciaApi('sitio')).toBe('SITIO_WEB');

    expect(mapearTipoRedDesdeApi('INSTAGRAM')).toBe('instagram');
    expect(mapearTipoRedDesdeApi('WHATSAPP')).toBe('whatsapp');
    expect(mapearTipoRedDesdeApi('FACEBOOK')).toBe('facebook');
    expect(mapearTipoRedDesdeApi('SITIO_WEB')).toBe('sitio');
  });

  it('mapea listas de redes en ambas direcciones', () => {
    expect(
      mapearRedesHaciaApi([
        { tipo: 'instagram', valor: '@finca' },
        { tipo: 'sitio', valor: 'https://finca.cr' },
      ]),
    ).toEqual([
      { tipo: 'INSTAGRAM', valor: '@finca' },
      { tipo: 'SITIO_WEB', valor: 'https://finca.cr' },
    ]);

    expect(
      mapearRedesDesdeApi([
        { tipo: 'WHATSAPP', valor: '+506 8888-4321' },
        { tipo: 'SITIO_WEB', valor: 'lacatalina.cr' },
      ]),
    ).toEqual([
      { tipo: 'whatsapp', valor: '+506 8888-4321' },
      { tipo: 'sitio', valor: 'lacatalina.cr' },
    ]);
  });

  it('arma etiqueta legible de roles vía ROL_DESDE_API', () => {
    expect(etiquetaRoles(['cafetalero'])).toBe('Cafetalero');
    expect(etiquetaRoles(['cafetalero', 'tostador', 'cafeteria'])).toBe(
      'Cafetalero · Tostador · Cafetería',
    );
  });

  it('mapea CuentaResponseApi a PerfilUsuario (avatarUrl ← fotoUrl) y a Cuenta', () => {
    const respuesta: CuentaResponseApi = {
      id: '11111111-1111-1111-1111-111111111111',
      nombreCompleto: 'Rodrigo Alvarado',
      correo: 'rodrigo@fincalacatalina.cr',
      roles: ['CAFETALERO', 'TOSTADOR'],
      telefono: null,
      fotoUrl: 'https://cdn.ejemplo/foto.jpg',
      redes: [{ tipo: 'SITIO_WEB', valor: 'https://finca.cr' }],
    };

    expect(mapearCuentaResponseAPerfil(respuesta)).toEqual({
      id: respuesta.id,
      nombreCompleto: 'Rodrigo Alvarado',
      correo: 'rodrigo@fincalacatalina.cr',
      telefono: '',
      roles: ['cafetalero', 'tostador'],
      redes: [{ tipo: 'sitio', valor: 'https://finca.cr' }],
      portadaUrl: null,
      avatarUrl: 'https://cdn.ejemplo/foto.jpg',
    });

    expect(mapearCuentaResponseACuenta(respuesta)).toEqual({
      id: respuesta.id,
      nombreCompleto: 'Rodrigo Alvarado',
      correo: 'rodrigo@fincalacatalina.cr',
      roles: ['cafetalero', 'tostador'],
    });
  });

  it('arma ActualizarCuentaRequest sin fotoUrl y con teléfono vacío como null', () => {
    expect(
      aActualizarCuentaRequest({
        nombreCompleto: 'Rodrigo',
        telefono: '   ',
        redes: [{ tipo: 'sitio', valor: 'https://finca.cr' }],
      }),
    ).toEqual({
      nombreCompleto: 'Rodrigo',
      telefono: null,
      redes: [{ tipo: 'SITIO_WEB', valor: 'https://finca.cr' }],
    });

    expect(aActualizarCuentaRequest({ telefono: '+506 8888-4321' })).toEqual({
      telefono: '+506 8888-4321',
    });
  });
});
