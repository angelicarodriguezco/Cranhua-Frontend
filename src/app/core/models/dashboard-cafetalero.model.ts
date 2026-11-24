export type EstadoCosechaApi = 'BORRADOR' | 'PUBLICADA' | 'AGOTADA';

export type EstadoCosecha = 'Borrador' | 'Publicada' | 'Agotada';

export type TemaDashboard = 'claro' | 'oscuro';

export interface IndicadoresDashboard {
  fincasRegistradas: number;
  cosechasActivas: number;
  kgDisponibles: number;
  solicitudesPendientes: number;
}

export interface IndicadoresDashboardApi {
  fincasRegistradas: number;
  cosechasActivas: number;
  kgDisponibles: number;
  solicitudesPendientes: number;
}

export interface SolicitudTostador {
  id: string;
  nombreTostador: string;
  kgSolicitados: number;
  variedad: string;
  finca: string;
  cosechaId: string;
}

export interface SolicitudRecibidaApi {
  id: string;
  cosechaId: string;
  nombreTostador: string;
  variedad: string;
  finca: string;
  cantidadKg: number;
  solicitadaEn: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
}

export type RespuestaSolicitud = 'APROBADA' | 'RECHAZADA';

export interface FincaResumen {
  id: string;
  nombre: string;
  ubicacion: string;
  cosechasActivas: number;
}

export interface CosechaRecienteApi {
  id: string;
  fincaId: string;
  finca: string;
  variedad: string;
  proceso: string;
  kgDisponibles: number | null;
  estado: EstadoCosechaApi;
}

export interface CosechaReciente {
  id: string;
  variedad: string;
  finca: string;
  proceso: string;
  kgDisponibles: number | null;
  estado: EstadoCosecha;
}

export interface DashboardCafetaleroResponseApi {
  indicadores: IndicadoresDashboardApi;
  solicitudesRecientes: SolicitudRecibidaApi[];
  cosechasRecientes: CosechaRecienteApi[];
}

export interface PerfilCafetaleroSidebar {
  iniciales: string;
  nombreCompleto: string;
  rol: string;
}

export interface ResumenDashboard {
  indicadores: IndicadoresDashboard;
  solicitudes: SolicitudTostador[];
  cosechas: CosechaReciente[];
}
