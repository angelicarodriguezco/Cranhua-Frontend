import { ProcesoCosecha } from './cosecha-disponible.model';
import { EstiloTueste } from './negocio-tueste.model';

// Lote verde que el tostador ya le compró a un cafetalero
export interface LoteComprado {
  id: string;
  codigoLote: string;
  finca: string;
  variedad: string;
  proceso: ProcesoCosecha;
  kg: number;
  /** yyyy-mm-dd */
  fechaCompra: string;
  /** null mientras el tostador no lo genere */
  codigoTrazabilidad: string | null;
}

export interface Tueste {
  id: string;
  loteId: string;
  nivel: EstiloTueste;
  pesoVerdeKg: number;
  pesoTostadoKg: number;
  /** yyyy-mm-dd */
  fecha: string;
  notas: string | null;
  codigoTrazabilidad: string;
}

export type NuevoTueste = Omit<Tueste, 'id' | 'codigoTrazabilidad'>;