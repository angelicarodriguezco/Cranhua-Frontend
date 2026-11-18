import { PuntoMapaResponseApi } from '../models/punto-mapa-consumidor.model';
import {
  mapearPuntoMapaResponseAConsumidor,
  mapearTipoPuntoMapaDesdeApi,
  ubicacionLabelDesdeApi,
} from './punto-mapa-consumidor.mapper';

describe('punto-mapa-consumidor.mapper', () => {
  it('mapea tipos API → UI', () => {
    expect(mapearTipoPuntoMapaDesdeApi('FINCA')).toBe('finca');
    expect(mapearTipoPuntoMapaDesdeApi('TOSTADOR')).toBe('tostador');
    expect(mapearTipoPuntoMapaDesdeApi('CAFETERIA')).toBe('cafeteria');
  });

  it('arma ubicacionLabel con canton, y provincia solo si aporta', () => {
    expect(ubicacionLabelDesdeApi('Tarrazú', 'San José')).toBe('Tarrazú, San José');
    expect(ubicacionLabelDesdeApi('Escazú', 'Escazú')).toBe('Escazú');
    expect(ubicacionLabelDesdeApi('Naranjo', '')).toBe('Naranjo');
    expect(ubicacionLabelDesdeApi('  Tarrazú  ', '  San José  ')).toBe('Tarrazú, San José');
  });

  it('mapea PuntoMapaResponseApi a PuntoMapaConsumidor', () => {
    const api: PuntoMapaResponseApi = {
      tipo: 'FINCA',
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      nombre: 'Finca La Catalina',
      canton: 'Tarrazú',
      provincia: 'San José',
      coordenada: { lat: 9.6612, lng: -84.031 },
    };

    expect(mapearPuntoMapaResponseAConsumidor(api)).toEqual({
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      tipo: 'finca',
      nombre: 'Finca La Catalina',
      ubicacionLabel: 'Tarrazú, San José',
      coordenada: { lat: 9.6612, lng: -84.031 },
      rutaPerfil: '/explorar/finca/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    });
  });

  it('arma rutaPerfil según tipo e id UUID', () => {
    const tostador: PuntoMapaResponseApi = {
      tipo: 'TOSTADOR',
      id: '11111111-2222-3333-4444-555555555555',
      nombre: 'Tostaduría Volcán',
      canton: 'San José',
      provincia: 'San José',
      coordenada: { lat: 9.9335, lng: -84.0775 },
    };
    const cafeteria: PuntoMapaResponseApi = {
      tipo: 'CAFETERIA',
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      nombre: 'Café Brumas',
      canton: 'Escazú',
      provincia: 'San José',
      coordenada: { lat: 9.9205, lng: -84.137 },
    };

    expect(mapearPuntoMapaResponseAConsumidor(tostador).rutaPerfil).toBe(
      '/explorar/tostador/11111111-2222-3333-4444-555555555555',
    );
    expect(mapearPuntoMapaResponseAConsumidor(cafeteria).rutaPerfil).toBe(
      '/explorar/cafeteria/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    );
  });
});
