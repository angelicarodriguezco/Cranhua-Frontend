import { EstadoCosecha } from './dashboard-cafetalero.model';

// Procesos de beneficiado definidos en CP3-44
export const PROCESOS_BENEFICIADO = [
  'Honey',
  'Red honey',
  'Yellow honey',
  'Natural',
  'Lavado',
  'Anaeróbico',
] as const;

export type ProcesoBeneficiado = (typeof PROCESOS_BENEFICIADO)[number];

export interface Cosecha {
  id: string;
  fincaId: string;
  variedad: string;
  proceso: ProcesoBeneficiado;
  codigoLote: string;
  /** null mientras la cosecha sigue en beneficiado, igual que en el dashboard */
  kgDisponibles: number | null;
  estado: EstadoCosecha;
}
