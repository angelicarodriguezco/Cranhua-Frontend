import {
  CosechaReciente,
  CosechaRecienteApi,
  DashboardCafetaleroResponseApi,
  EstadoCosecha,
  EstadoCosechaApi,
  IndicadoresDashboard,
  IndicadoresDashboardApi,
  ResumenDashboard,
  SolicitudRecibidaApi,
  SolicitudTostador,
} from '../models/dashboard-cafetalero.model';

const ESTADO_DESDE_API: Record<EstadoCosechaApi, EstadoCosecha> = {
  BORRADOR: 'Borrador',
  PUBLICADA: 'Publicada',
  AGOTADA: 'Agotada',
};

export function estadoCosechaDesdeApi(estado: EstadoCosechaApi): EstadoCosecha {
  return ESTADO_DESDE_API[estado];
}

export function indicadoresDashboardDesdeApi(api: IndicadoresDashboardApi): IndicadoresDashboard {
  return {
    fincasRegistradas: api.fincasRegistradas,
    cosechasActivas: api.cosechasActivas,
    kgDisponibles: Number(api.kgDisponibles),
    solicitudesPendientes: api.solicitudesPendientes,
  };
}

export function solicitudTostadorDesdeApi(api: SolicitudRecibidaApi): SolicitudTostador {
  return {
    id: api.id,
    nombreTostador: api.nombreTostador,
    kgSolicitados: Number(api.cantidadKg),
    variedad: api.variedad,
    finca: api.finca,
    cosechaId: api.cosechaId,
  };
}

export function cosechaRecienteDesdeApi(api: CosechaRecienteApi): CosechaReciente {
  return {
    id: api.id,
    variedad: api.variedad,
    finca: api.finca,
    proceso: api.proceso,
    kgDisponibles: api.kgDisponibles == null ? null : Number(api.kgDisponibles),
    estado: estadoCosechaDesdeApi(api.estado),
  };
}

export function resumenDashboardDesdeApi(api: DashboardCafetaleroResponseApi): ResumenDashboard {
  return {
    indicadores: indicadoresDashboardDesdeApi(api.indicadores),
    solicitudes: api.solicitudesRecientes.map(solicitudTostadorDesdeApi),
    cosechas: api.cosechasRecientes.map(cosechaRecienteDesdeApi),
  };
}
