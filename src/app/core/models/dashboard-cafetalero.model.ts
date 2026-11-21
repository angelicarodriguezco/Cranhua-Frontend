export type EstadoCosecha = 'Disponible' | 'En beneficiado' | 'En catación' | 'Vendida';

export type TemaDashboard = 'claro' | 'oscuro';

export interface IndicadoresDashboard {
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

/** GET /api/solicitudes/recibidas */
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

export interface CosechaReciente {
  id: string;
  variedad: string;
  finca: string;
  proceso: string;
  kgDisponibles: number | null;
  estado: EstadoCosecha;
}

export interface PerfilCafetaleroSidebar {
  iniciales: string;
  nombreCompleto: string;
  rol: string;
}

export interface ResumenDashboard {
  indicadores: IndicadoresDashboard;
  solicitudes: SolicitudTostador[];
  fincas: FincaResumen[];
  cosechas: CosechaReciente[];
}
