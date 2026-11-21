export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada';

export type EstadoSolicitudApi = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface Solicitud {
  id: string;
  cosechaId: string;
  finca: string;
  lote: string;
  kilos: number;
  fecha: string;
  estado: EstadoSolicitud;
}

export interface IndicadoresSolicitudes {
  pendientes: number;
  esteMes: number;
  fincasContactadas: number;
}

export interface SolicitudesEnviadas {
  indicadores: IndicadoresSolicitudes;
  solicitudes: Solicitud[];
}

export interface SolicitudEnviadaApi {
  id: string;
  cosechaId: string;
  fincaId: string;
  finca: string;
  variedad: string;
  codigoLote: string | null;
  cantidadKg: number;
  solicitadaEn: string;
  estado: EstadoSolicitudApi;
}

export interface SolicitudesEnviadasResponseApi {
  indicadores: IndicadoresSolicitudes;
  solicitudes: SolicitudEnviadaApi[];
}

export interface CrearSolicitudRequestApi {
  cosechaId: string;
  cantidadKg: number;
}

export interface SolicitudCreadaApi {
  id: string;
  cosechaId: string;
  cantidadKg: number;
  precioKg: number;
  totalEstimado: number;
  estado: EstadoSolicitudApi;
  solicitadaEn: string;
  respondidaEn: string | null;
  codigoLote: string | null;
}

export interface ErrorSolicitud {
  mensaje: string;
  errores: Record<string, string>;
}
