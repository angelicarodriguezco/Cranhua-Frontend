export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada';

export interface Solicitud {
  id: string;
  cosechaId: string;
  finca: string;
  lote: string;
  kilos: number;
  /** yyyy-mm-dd */
  fecha: string;
  estado: EstadoSolicitud;
}

export interface IndicadoresSolicitudes {
  pendientes: number;
  esteMes: number;
  fincasContactadas: number;
}
