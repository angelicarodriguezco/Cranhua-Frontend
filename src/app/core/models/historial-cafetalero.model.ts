export type EstadoCosechaHistorial = 'Disponible' | 'En beneficiado' | 'En catación' | 'Vendida';

export interface CosechaHistorial {
  id: string;
  fecha: string;
  variedad: string;
  kilos: number;
  estado: EstadoCosechaHistorial;
}

export interface LoteVendido {
  codigo: string;
  cosechaId: string;
  comprador: string;
  kilos: number;
  precioColones: number;
  fechaVenta: string;
}

export interface IndicadoresHistorial {
  cosechasRegistradas: number;
  produccionTotalKg: number;
  lotesVendidos: number;
}
