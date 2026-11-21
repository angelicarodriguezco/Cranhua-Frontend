import { ProcesoCosecha } from './cosecha-disponible.model';
import { EstiloTueste } from './negocio-tueste.model';

export type EstadoTrazabilidadApi = 'PENDIENTE' | 'ACTIVO';

export type NivelTuesteApi = 'CLARO' | 'MEDIO' | 'OSCURO';

export interface IndicadoresLotes {
  lotes: number;
  kg: number;
  conCodigo: number;
}

export interface LoteComprado {
  id: string;
  codigoLote: string;
  finca: string;
  variedad: string;
  proceso: ProcesoCosecha | null;
  kg: number;
  fechaCompra: string;
  codigoTrazabilidad: string | null;
}

export interface LotesComprados {
  indicadores: IndicadoresLotes;
  lotes: LoteComprado[];
}

export interface Tueste {
  id: string;
  loteId: string;
  nivel: EstiloTueste;
  pesoVerdeKg: number;
  pesoTostadoKg: number;
  fecha: string;
  notas: string | null;
  codigoTrazabilidad: string;
}

export type NuevoTueste = Omit<Tueste, 'id' | 'codigoTrazabilidad'>;

export interface LoteCompradoApi {
  id: string;
  codigo: string;
  finca: string;
  variedad: string;
  kg: number;
  fechaCompra: string;
  estado: EstadoTrazabilidadApi;
}

export interface IndicadoresLotesApi {
  lotesComprados: number;
  kgComprados: number;
  lotesConCodigo: number;
}

export interface LotesCompradosResponseApi {
  indicadores: IndicadoresLotesApi;
  lotes: LoteCompradoApi[];
}

export interface FichaCodigoApi {
  id: string;
  codigo: string;
  finca: string;
  variedad: string;
  kg: number;
  tostador: string;
  estado: EstadoTrazabilidadApi;
  activadoEn: string | null;
}

export interface TuesteApi {
  id: string;
  loteId: string;
  codigoLote?: string | null;
  nivel: NivelTuesteApi;
  pesoVerdeKg: number;
  pesoTostadoKg: number;
  merma: number;
  fechaTueste: string;
  notas: string | null;
}

export interface RegistrarTuesteRequestApi {
  loteId: string;
  nivel: NivelTuesteApi;
  pesoVerdeKg: number;
  pesoTostadoKg: number;
  fechaTueste: string;
  notas: string | null;
}

export interface ActualizarTuesteRequestApi {
  nivel?: NivelTuesteApi;
  pesoVerdeKg?: number;
  pesoTostadoKg?: number;
  fechaTueste?: string;
  notas?: string | null;
}

export interface LoteConKgPorTostar extends LoteComprado {
  kgPorTostar: number;
}

export interface CodigoGenerado {
  lote: LoteComprado;
  tostador: string;
}

export interface ErrorTueste {
  mensaje: string;
  errores: Record<string, string>;
}
