import { EstadoCosecha, EstadoCosechaApi } from './dashboard-cafetalero.model';

export type EstadoCosechaHistorial = EstadoCosecha;
export type EstadoCosechaHistorialApi = EstadoCosechaApi;

export interface Pagina<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
}

export interface IndicadoresHistorial {
  cosechasRegistradas: number;
  produccionTotalKg: number;
  lotesVendidos: number;
}

export interface IndicadoresHistorialApi {
  cosechasRegistradas: number;
  produccionTotalKg: number;
  lotesVendidos: number;
}

export interface CosechaHistorialApi {
  id: string;
  fincaId: string;
  finca: string;
  variedad: string;
  fechaInicio: string;
  fechaFin: string;
  cantidadCosechadaKg: number;
  estado: EstadoCosechaHistorialApi;
}

export interface CosechaHistorial {
  id: string;
  fincaId: string;
  finca: string;
  variedad: string;
  fechaInicio: string;
  fechaFin: string;
  cantidadCosechadaKg: number;
  estado: EstadoCosechaHistorial;
}

export interface LoteVendidoApi {
  id: string;
  codigo: string;
  cosechaId: string;
  fincaId: string;
  finca: string;
  variedad: string;
  comprador: string;
  kg: number;
  precioKg: number;
  total: number;
  vendidoEn: string;
}

export interface LoteVendido {
  id: string;
  codigo: string;
  cosechaId: string;
  fincaId: string;
  finca: string;
  variedad: string;
  comprador: string;
  kg: number;
  precioKg: number;
  total: number;
  vendidoEn: string;
}

export interface HistorialCafetaleroResponseApi {
  indicadores: IndicadoresHistorialApi;
  cosechas: Pagina<CosechaHistorialApi>;
  lotesVendidos: Pagina<LoteVendidoApi>;
}

export interface HistorialCafetalero {
  indicadores: IndicadoresHistorial;
  cosechas: CosechaHistorial[];
  lotesVendidos: LoteVendido[];
}
