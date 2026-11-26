import { fechaMiembroDesdeApi, perfilCafeteriaDesdeApi } from './perfil-cafeteria.mapper';
import { PerfilCafeteriaResponseApi } from '../models/perfil-cafeteria.model';

describe('perfil-cafeteria.mapper', () => {
  it('recorta Instant a fecha YYYY-MM-DD', () => {
    expect(fechaMiembroDesdeApi('2025-06-10T15:30:00Z')).toBe('2025-06-10');
  });

  it('mapea el perfil público de cafetería', () => {
    const api: PerfilCafeteriaResponseApi = {
      id: 'cafeteria-1',
      nombre: 'Café Brumas',
      descripcion: '  Especialidad costarricense  ',
      horario: ' Lun a sáb ',
      canton: 'Escazú',
      provincia: 'San José',
      ubicacion: { lat: 9.9205, lng: -84.137 },
      estilos: ['CLARO', 'MEDIO'],
      portadaUrl: 'https://cdn.example/portada.jpg',
      miembroDesde: '2025-06-10T12:00:00Z',
      cafesTrazables: 2,
      fincas: [
        {
          id: 'finca-1',
          nombre: 'Finca La Catalina',
          canton: 'Tarrazú',
          provincia: 'San José',
        },
      ],
      tostadores: [
        {
          id: 'tostador-1',
          nombre: 'Tostaduría Volcán',
          canton: 'San José',
          provincia: 'San José',
        },
      ],
    };

    expect(perfilCafeteriaDesdeApi(api)).toEqual({
      id: 'cafeteria-1',
      nombre: 'Café Brumas',
      ubicacion: 'Escazú, San José',
      descripcion: 'Especialidad costarricense',
      coordenada: { lat: 9.9205, lng: -84.137 },
      cafesTrazables: 2,
      tostadores: [{ id: 'tostador-1', nombre: 'Tostaduría Volcán', ubicacion: 'San José' }],
      horario: 'Lun a sáb',
      miembroDesde: '2025-06-10',
      fincas: [{ id: 'finca-1', nombre: 'Finca La Catalina', ubicacion: 'Tarrazú, San José' }],
      portadaUrl: 'https://cdn.example/portada.jpg',
    });
  });
});
