export interface ProcesoReparto {
  proceso: string;
  porcentaje: number;
}

export interface FincaCosechaOpcion {
  id: string;
  nombre: string;
}

export interface ProcesoBeneficiado {
  id: string;
  nombre: string;
  color: string;
}

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
}

export type NuevaCosecha = Omit<Cosecha, 'id'>;
