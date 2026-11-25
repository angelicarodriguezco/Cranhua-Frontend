import {
  cafeMenuPublicoDesdeApi,
  comidaMenuPublicoDesdeApi,
  enlacePerfilDesdeApi,
  idItemMenuPublico,
  menuPublicoDesdeApi,
  nivelTuesteMenuDesdeApi,
  notasMenuDesdeApi,
} from './menu-publico.mapper';
import { MenuPublicoResponseApi } from '../models/menu-publico.model';

describe('menu-publico.mapper', () => {
  it('mapea enlace de perfil con ubicación canton, provincia', () => {
    expect(
      enlacePerfilDesdeApi({
        id: 'finca-1',
        nombre: 'Finca La Catalina',
        canton: 'Tarrazú',
        provincia: 'San José',
      }),
    ).toEqual({
      id: 'finca-1',
      nombre: 'Finca La Catalina',
      ubicacion: 'Tarrazú, San José',
    });
  });

  it('une notas y mapea nivel de tueste', () => {
    expect(notasMenuDesdeApi(['Caramelo', '  Cítricos '])).toBe('Caramelo, Cítricos');
    expect(notasMenuDesdeApi(null)).toBe('');
    expect(nivelTuesteMenuDesdeApi('CLARO')).toBe('Claro');
    expect(nivelTuesteMenuDesdeApi(null)).toBe('');
  });

  it('genera id estable para ítems sin id de API', () => {
    expect(idItemMenuPublico('Espresso', 1500, 0)).toBe('Espresso-1500-0');
  });

  it('mapea café con finca opcional y comida', () => {
    expect(
      cafeMenuPublicoDesdeApi(
        {
          nombre: 'Espresso',
          precio: 1500,
          nivelTueste: 'MEDIO',
          notas: ['Chocolate'],
          fincaOrigen: {
            id: 'finca-1',
            nombre: 'Finca La Catalina',
            canton: 'Tarrazú',
            provincia: 'San José',
          },
        },
        0,
      ),
    ).toEqual({
      id: 'Espresso-1500-0',
      nombre: 'Espresso',
      nivelTueste: 'Medio',
      notas: 'Chocolate',
      precio: 1500,
      fincaOrigen: {
        id: 'finca-1',
        nombre: 'Finca La Catalina',
        ubicacion: 'Tarrazú, San José',
      },
    });

    expect(
      cafeMenuPublicoDesdeApi({ nombre: 'Cold Brew', precio: 2000 }, 1).fincaOrigen,
    ).toBeNull();

    expect(comidaMenuPublicoDesdeApi({ nombre: 'Croissant', precio: 1200 }, 0)).toEqual({
      id: 'Croissant-1200-0',
      nombre: 'Croissant',
      precio: 1200,
    });
  });

  it('mapea el menú público completo', () => {
    const api: MenuPublicoResponseApi = {
      id: 'cafeteria-1',
      nombre: 'Café Brumas',
      canton: 'Escazú',
      provincia: 'San José',
      ubicacion: { lat: 9.92, lng: -84.13 },
      cafes: [{ nombre: 'Espresso', precio: 1500, nivelTueste: 'CLARO', notas: ['Cítricos'] }],
      otrasComidas: [{ nombre: 'Queque', precio: 1800 }],
    };

    expect(menuPublicoDesdeApi(api)).toEqual({
      cafeteriaId: 'cafeteria-1',
      nombre: 'Café Brumas',
      ubicacion: 'Escazú, San José',
      cafes: [
        {
          id: 'Espresso-1500-0',
          nombre: 'Espresso',
          nivelTueste: 'Claro',
          notas: 'Cítricos',
          precio: 1500,
          fincaOrigen: null,
        },
      ],
      otrasComidas: [{ id: 'Queque-1800-0', nombre: 'Queque', precio: 1800 }],
    });
  });
});
