import {
  CosechaDisponibleApi,
  IMAGEN_COSECHA_DISPONIBLE,
} from '../models/cosecha-disponible.model';
import { DetalleCosechaDisponibleApi } from '../models/detalle-cosecha.model';
import {
  cosechaDisponibleDesdeApi,
  detalleCosechaDesdeApi,
  ubicacionCosechaDesdeApi,
  usuarioDesdeProductorApi,
} from './cosecha-disponible.mapper';

describe('cosecha-disponible.mapper', () => {
  const listaApi: CosechaDisponibleApi = {
    id: 'c-1',
    fincaId: 'f-1',
    finca: 'La Catalina',
    zona: 'Tarrazú',
    canton: 'Tarrazú',
    provincia: 'San José',
    variedad: 'Caturra',
    proceso: 'Red honey',
    notas: ['Panela', 'Jazmín'],
    precioKg: 5800,
  };

  it('arma ubicacion como canton, provincia', () => {
    expect(ubicacionCosechaDesdeApi('Tarrazú', 'San José')).toBe('Tarrazú, San José');
  });

  it('parte nombreCompleto en nombre y apellidos', () => {
    expect(
      usuarioDesdeProductorApi({
        id: 'u-1',
        nombreCompleto: 'Rodrigo Solís Ureña',
        correo: 'rodrigo@ejemplo.cr',
        telefono: '8888-1234',
      }),
    ).toEqual({
      id: 'u-1',
      nombre: 'Rodrigo',
      apellidos: 'Solís Ureña',
      correo: 'rodrigo@ejemplo.cr',
    });

    expect(
      usuarioDesdeProductorApi({
        id: 'u-2',
        nombreCompleto: 'Andrés',
        correo: 'andres@ejemplo.cr',
        telefono: null,
      }),
    ).toEqual({
      id: 'u-2',
      nombre: 'Andrés',
      apellidos: '',
      correo: 'andres@ejemplo.cr',
    });
  });

  it('mapea CosechaDisponibleApi a CosechaDisponible (precioKg → precioDesdeKg, placeholder)', () => {
    expect(cosechaDisponibleDesdeApi(listaApi)).toEqual({
      id: 'c-1',
      finca: 'La Catalina',
      zona: 'Tarrazú',
      ubicacion: 'Tarrazú, San José',
      variedad: 'Caturra',
      proceso: 'Red honey',
      notas: ['Panela', 'Jazmín'],
      precioDesdeKg: 5800,
      disponibilidad: 'Disponible',
      imagenUrl: IMAGEN_COSECHA_DISPONIBLE,
    });
  });

  it('mapea DetalleCosechaDisponibleApi (alturaMsnm → altitudMsnm, primer productor, descripción)', () => {
    const detalleApi: DetalleCosechaDisponibleApi = {
      ...listaApi,
      procesos: [{ proceso: 'Red honey', porcentaje: 100 }],
      alturaMsnm: 1650,
      kgDisponibles: 320,
      puntajeSca: 86.5,
      codigoLote: 'LC-2026-001',
      productores: [
        {
          id: 'u-1',
          nombreCompleto: 'María Jiménez Solano',
          correo: 'maria@ejemplo.cr',
          telefono: '8888-0000',
        },
        {
          id: 'u-2',
          nombreCompleto: 'Otro Dueño',
          correo: 'otro@ejemplo.cr',
          telefono: null,
        },
      ],
    };

    expect(detalleCosechaDesdeApi(detalleApi)).toEqual({
      id: 'c-1',
      finca: 'La Catalina',
      zona: 'Tarrazú',
      ubicacion: 'Tarrazú, San José',
      variedad: 'Caturra',
      proceso: 'Red honey',
      notas: ['Panela', 'Jazmín'],
      precioDesdeKg: 5800,
      disponibilidad: 'Disponible',
      imagenUrl: IMAGEN_COSECHA_DISPONIBLE,
      altitudMsnm: 1650,
      kgDisponibles: 320,
      precioKg: 5800,
      descripcion: 'Lote LC-2026-001 · SCA 86.5',
      productor: {
        id: 'u-1',
        nombre: 'María',
        apellidos: 'Jiménez Solano',
        correo: 'maria@ejemplo.cr',
      },
    });
  });

  it('deja descripción vacía y productor vacío si no hay datos opcionales', () => {
    const sinExtras: DetalleCosechaDisponibleApi = {
      ...listaApi,
      procesos: [],
      alturaMsnm: null,
      kgDisponibles: 100,
      puntajeSca: null,
      codigoLote: null,
      productores: [],
    };

    const detalle = detalleCosechaDesdeApi(sinExtras);
    expect(detalle.descripcion).toBe('');
    expect(detalle.altitudMsnm).toBe(0);
    expect(detalle.productor).toEqual({ id: '', nombre: '', apellidos: '', correo: '' });
  });
});
