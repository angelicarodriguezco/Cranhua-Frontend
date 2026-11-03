import { EstadoCosecha } from './dashboard-cafetalero.model';

export interface ProcesoReparto {
  proceso: string;
  porcentaje: number;
}

export interface FincaCosechaOpcion {
  id: string;
  nombre: string;
}

/** Opción del catálogo con color (formulario Registrar/Editar cosecha). */
export interface OpcionProcesoBeneficiado {
  id: string;
  nombre: string;
  color: string;
}

/** @deprecated Usar OpcionProcesoBeneficiado; se mantiene por compatibilidad del formulario. */
export type ProcesoBeneficiadoCatalogo = OpcionProcesoBeneficiado;

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
  alturaMsnm: number;
  cantidadTotalKg: number;
  fechaInicio: string;
  fechaFin: string;
  procesos: ProcesoReparto[];
  pesoAntesKg: number;
  pesoTrasSeleccionKg: number;
  separoCaracolillo: boolean | null;
  pesoCaracolilloKg: number | null;
  puntajeSca: number | null;
  notasCatacion: string | null;
  /** Proceso principal para listados (detalle de finca / historial). */
  proceso: string;
  codigoLote: string;
  /** null mientras la cosecha sigue en beneficiado, igual que en el dashboard */
  kgDisponibles: number | null;
  estado: EstadoCosecha;
}

export type NuevaCosecha = Omit<
  Cosecha,
  'id' | 'proceso' | 'codigoLote' | 'kgDisponibles' | 'estado'
> &
  Partial<Pick<Cosecha, 'proceso' | 'codigoLote' | 'kgDisponibles' | 'estado'>>;
