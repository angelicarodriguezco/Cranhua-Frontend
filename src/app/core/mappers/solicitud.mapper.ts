import { NuevaSolicitud } from '../models/detalle-cosecha.model';
import {
  CrearSolicitudRequestApi,
  EstadoSolicitud,
  EstadoSolicitudApi,
  IndicadoresSolicitudes,
  Solicitud,
  SolicitudEnviadaApi,
  SolicitudesEnviadas,
  SolicitudesEnviadasResponseApi,
} from '../models/solicitud.model';

const ESTADO_DESDE_API: Record<EstadoSolicitudApi, EstadoSolicitud> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
};

export function estadoSolicitudDesdeApi(estado: EstadoSolicitudApi): EstadoSolicitud {
  return ESTADO_DESDE_API[estado];
}

export function fechaLocalDesdeInstant(iso: string): string {
  const fecha = new Date(iso);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function indicadoresSolicitudesDesdeApi(
  api: IndicadoresSolicitudes,
): IndicadoresSolicitudes {
  return {
    pendientes: api.pendientes,
    esteMes: api.esteMes,
    fincasContactadas: api.fincasContactadas,
  };
}

export function solicitudEnviadaDesdeApi(api: SolicitudEnviadaApi): Solicitud {
  return {
    id: api.id,
    cosechaId: api.cosechaId,
    finca: api.finca,
    lote: api.codigoLote ?? api.variedad,
    kilos: Number(api.cantidadKg),
    fecha: fechaLocalDesdeInstant(api.solicitadaEn),
    estado: estadoSolicitudDesdeApi(api.estado),
  };
}

export function solicitudesEnviadasDesdeApi(
  api: SolicitudesEnviadasResponseApi,
): SolicitudesEnviadas {
  return {
    indicadores: indicadoresSolicitudesDesdeApi(api.indicadores),
    solicitudes: api.solicitudes.map(solicitudEnviadaDesdeApi),
  };
}

export function cuerpoCrearSolicitud(nueva: NuevaSolicitud): CrearSolicitudRequestApi {
  return {
    cosechaId: nueva.cosechaId,
    cantidadKg: nueva.kilos,
  };
}
