import { EstadoCosecha } from './dashboard-cafetalero.model';

export interface ProcesoReparto {
  proceso: string;
  porcentaje: number;
}

export interface OpcionProcesoBeneficiado {
  id: string;
  nombre: string;
  color: string;
}

export const CATALOGO_PROCESOS_BENEFICIADO: OpcionProcesoBeneficiado[] = [
  { id: 'honey', nombre: 'Honey', color: '#A57008' },
  { id: 'lavado', nombre: 'Lavado', color: '#2F6B45' },
  { id: 'natural', nombre: 'Natural', color: '#8B4513' },
  { id: 'anaerobico', nombre: 'Anaeróbico', color: '#4A6FA5' },
  { id: 'semi-lavado', nombre: 'Semi-lavado', color: '#6B8E23' },
  { id: 'red-honey', nombre: 'Red honey', color: '#B33A3A' },
  { id: 'yellow-honey', nombre: 'Yellow honey', color: '#C9A227' },
];

export const VARIEDADES_CAFE = [
  'Caturra',
  'Catuaí',
  'Geisha',
  'Typica',
  'Bourbon',
  'Villa Sarchí',
] as const;

export interface Cosecha {
  id: string;
  fincaId: string;
  fincaNombre: string | null;
  variedad: string;
  alturaMsnm: number;
  cantidadTotalKg: number;
  fechaInicio: string;
  fechaFin: string;
  procesos: ProcesoReparto[];
  pesoAntesKg: number | null;
  pesoTrasSeleccionKg: number | null;
  separoCaracolillo: boolean | null;
  pesoCaracolilloKg: number | null;
  mermaSeleccionPorcentaje: number | null;
  puntajeSca: number | null;
  notasCatacion: string | null;
  precioKg: number;
  /** Proceso principal para listados (detalle de finca / historial). */
  proceso: string;
  codigoLote: string | null;
  /** null mientras la cosecha sigue en beneficiado, igual que en el dashboard */
  kgDisponibles: number | null;
  estado: EstadoCosecha;
}

export interface NuevaCosecha {
  fincaId: string;
  variedad: string;
  alturaMsnm: number;
  cantidadTotalKg: number;
  fechaInicio: string;
  fechaFin: string;
  procesos: ProcesoReparto[];
  pesoAntesKg: number | null;
  pesoTrasSeleccionKg: number | null;
  separoCaracolillo: boolean | null;
  pesoCaracolilloKg: number | null;
  puntajeSca: number | null;
  notasCatacion: string | null;
  precioKg: number;
}

export interface CosechaResponseApi {
  id: string;
  fincaId: string;
  variedad: string;
  alturaMsnm: number;
  fechaInicio: string;
  fechaFin: string;
  procesos: ProcesoReparto[];
  cantidadCosechadaKg: number;
  pesoTrasBeneficiadoKg: number | null;
  pesoTrasSeleccionKg: number | null;
  caracolilloKg: number | null;
  mermaBeneficiadoPorcentaje: number | null;
  mermaSeleccionPorcentaje: number | null;
  notasSabor: string | null;
  puntajeSca: number | null;
  precioKg: number;
  kgDisponibles: number | null;
  estado: 'EN_BENEFICIADO' | 'DISPONIBLE';
  codigoLote: string | null;
  fincaNombre?: string;
}

// 400 con los mensajes por campo, o solo un mensaje general
export interface ErrorCosecha {
  mensaje: string;
  errores: Record<string, string>;
}
