import {
  CosechaRecienteApi,
  DashboardCafetaleroResponseApi,
  IndicadoresDashboardApi,
  SolicitudRecibidaApi,
} from '../models/dashboard-cafetalero.model';
import {
  cosechaRecienteDesdeApi,
  estadoCosechaDesdeApi,
  indicadoresDashboardDesdeApi,
  resumenDashboardDesdeApi,
  solicitudTostadorDesdeApi,
} from './dashboard-cafetalero.mapper';

describe('dashboard-cafetalero.mapper', () => {
  it('mapea estado API → UI', () => {
    expect(estadoCosechaDesdeApi('BORRADOR')).toBe('Borrador');
    expect(estadoCosechaDesdeApi('PUBLICADA')).toBe('Publicada');
    expect(estadoCosechaDesdeApi('AGOTADA')).toBe('Agotada');
  });

  it('convierte kgDisponibles BigDecimal a número en indicadores', () => {
    const api: IndicadoresDashboardApi = {
      fincasRegistradas: 2,
      cosechasActivas: 3,
      kgDisponibles: '146.5' as unknown as number,
      solicitudesPendientes: 1,
    };

    expect(indicadoresDashboardDesdeApi(api)).toEqual({
      fincasRegistradas: 2,
      cosechasActivas: 3,
      kgDisponibles: 146.5,
      solicitudesPendientes: 1,
    });
  });

  it('mapea SolicitudRecibidaApi (cantidadKg → kgSolicitados)', () => {
    const api: SolicitudRecibidaApi = {
      id: 's-1',
      cosechaId: 'c-1',
      nombreTostador: 'Tostaduría Volcán',
      variedad: 'Caturra',
      finca: 'La Catalina',
      cantidadKg: '40' as unknown as number,
      solicitadaEn: '2026-11-19T15:00:00Z',
      estado: 'PENDIENTE',
    };

    expect(solicitudTostadorDesdeApi(api)).toEqual({
      id: 's-1',
      nombreTostador: 'Tostaduría Volcán',
      kgSolicitados: 40,
      variedad: 'Caturra',
      finca: 'La Catalina',
      cosechaId: 'c-1',
    });
  });

  it('mapea CosechaRecienteApi con kg null y estado legible', () => {
    const publicada: CosechaRecienteApi = {
      id: 'cosecha-1',
      fincaId: 'finca-1',
      finca: 'La Catalina',
      variedad: 'Caturra',
      proceso: 'Honey',
      kgDisponibles: '96' as unknown as number,
      estado: 'PUBLICADA',
    };

    expect(cosechaRecienteDesdeApi(publicada)).toEqual({
      id: 'cosecha-1',
      variedad: 'Caturra',
      finca: 'La Catalina',
      proceso: 'Honey',
      kgDisponibles: 96,
      estado: 'Publicada',
    });

    const borrador: CosechaRecienteApi = {
      ...publicada,
      id: 'cosecha-2',
      kgDisponibles: null,
      estado: 'BORRADOR',
    };

    expect(cosechaRecienteDesdeApi(borrador).kgDisponibles).toBeNull();
    expect(cosechaRecienteDesdeApi(borrador).estado).toBe('Borrador');
  });

  it('mapea DashboardCafetaleroResponseApi completo', () => {
    const api: DashboardCafetaleroResponseApi = {
      indicadores: {
        fincasRegistradas: 1,
        cosechasActivas: 1,
        kgDisponibles: 50,
        solicitudesPendientes: 1,
      },
      solicitudesRecientes: [
        {
          id: 's-1',
          cosechaId: 'c-1',
          nombreTostador: 'Café Altamira',
          variedad: 'Geisha',
          finca: 'Monte Alto',
          cantidadKg: 25,
          solicitadaEn: '2026-11-18T15:00:00Z',
          estado: 'PENDIENTE',
        },
      ],
      cosechasRecientes: [
        {
          id: 'cosecha-1',
          fincaId: 'finca-1',
          finca: 'Monte Alto',
          variedad: 'Geisha',
          proceso: 'Lavado',
          kgDisponibles: 50,
          estado: 'PUBLICADA',
        },
      ],
    };

    const resumen = resumenDashboardDesdeApi(api);

    expect(resumen.indicadores.kgDisponibles).toBe(50);
    expect(resumen.solicitudes).toEqual([solicitudTostadorDesdeApi(api.solicitudesRecientes[0])]);
    expect(resumen.cosechas).toEqual([cosechaRecienteDesdeApi(api.cosechasRecientes[0])]);
  });
});
