import { NuevaSolicitud } from '../models/detalle-cosecha.model';
import { SolicitudEnviadaApi, SolicitudesEnviadasResponseApi } from '../models/solicitud.model';
import {
  cuerpoCrearSolicitud,
  estadoSolicitudDesdeApi,
  fechaLocalDesdeInstant,
  solicitudEnviadaDesdeApi,
  solicitudesEnviadasDesdeApi,
} from './solicitud.mapper';

describe('solicitud.mapper', () => {
  it('mapea estado API → UI', () => {
    expect(estadoSolicitudDesdeApi('PENDIENTE')).toBe('Pendiente');
    expect(estadoSolicitudDesdeApi('APROBADA')).toBe('Aprobada');
    expect(estadoSolicitudDesdeApi('RECHAZADA')).toBe('Rechazada');
  });

  it('convierte Instant ISO a fecha local yyyy-mm-dd', () => {
    const iso = '2026-03-15T18:30:00.000Z';
    const esperada = fechaLocalDesdeInstant(iso);
    const local = new Date(iso);
    const mes = String(local.getMonth() + 1).padStart(2, '0');
    const dia = String(local.getDate()).padStart(2, '0');
    expect(esperada).toBe(`${local.getFullYear()}-${mes}-${dia}`);
  });

  it('mapea SolicitudEnviadaApi (cantidadKg → kilos, lote = codigoLote ?? variedad)', () => {
    const pendiente: SolicitudEnviadaApi = {
      id: 's-1',
      cosechaId: 'c-1',
      fincaId: 'f-1',
      finca: 'Monte Alto',
      variedad: 'Geisha',
      codigoLote: null,
      cantidadKg: 40,
      solicitadaEn: '2026-11-20T15:00:00.000Z',
      estado: 'PENDIENTE',
    };

    expect(solicitudEnviadaDesdeApi(pendiente)).toEqual({
      id: 's-1',
      cosechaId: 'c-1',
      finca: 'Monte Alto',
      lote: 'Geisha',
      kilos: 40,
      fecha: fechaLocalDesdeInstant(pendiente.solicitadaEn),
      estado: 'Pendiente',
    });

    const aprobada: SolicitudEnviadaApi = {
      ...pendiente,
      id: 's-2',
      codigoLote: 'CRH-2026-0001',
      estado: 'APROBADA',
    };

    expect(solicitudEnviadaDesdeApi(aprobada).lote).toBe('CRH-2026-0001');
    expect(solicitudEnviadaDesdeApi(aprobada).estado).toBe('Aprobada');
  });

  it('mapea SolicitudesEnviadasResponseApi con indicadores del API', () => {
    const api: SolicitudesEnviadasResponseApi = {
      indicadores: { pendientes: 1, esteMes: 2, fincasContactadas: 3 },
      solicitudes: [
        {
          id: 's-1',
          cosechaId: 'c-1',
          fincaId: 'f-1',
          finca: 'La Catalina',
          variedad: 'Caturra',
          codigoLote: null,
          cantidadKg: 20,
          solicitadaEn: '2026-11-19T12:00:00.000Z',
          estado: 'PENDIENTE',
        },
      ],
    };

    expect(solicitudesEnviadasDesdeApi(api)).toEqual({
      indicadores: { pendientes: 1, esteMes: 2, fincasContactadas: 3 },
      solicitudes: [solicitudEnviadaDesdeApi(api.solicitudes[0])],
    });
  });

  it('arma el body de crear con cantidadKg y sin precioKg', () => {
    const nueva: NuevaSolicitud = {
      cosechaId: 'c-1',
      kilos: 45.5,
      precioKg: 5800,
    };

    expect(cuerpoCrearSolicitud(nueva)).toEqual({
      cosechaId: 'c-1',
      cantidadKg: 45.5,
    });
  });
});
