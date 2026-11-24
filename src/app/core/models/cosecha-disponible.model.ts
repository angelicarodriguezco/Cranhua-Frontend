import { ZonaCafetalera } from './finca.model';

export type ProcesoCosecha = string;

export type DisponibilidadCosecha = 'Disponible' | 'Próximamente';

export type RangoPrecioCosecha = 'bajo' | 'medio' | 'alto';

export const NOTAS_FLORALES = ['Azahar', 'Flor de café', 'Hibisco', 'Jazmín', 'Lavanda', 'Rosa'];

export const RANGOS_PRECIO_COSECHA: Record<
  RangoPrecioCosecha,
  { etiqueta: string; min: number; max: number }
> = {
  bajo: { etiqueta: 'Hasta ₡6 000', min: 0, max: 6000 },
  medio: { etiqueta: '₡6 001 – ₡9 000', min: 6001, max: 9000 },
  alto: { etiqueta: 'Más de ₡9 000', min: 9001, max: Number.POSITIVE_INFINITY },
};

export const IMAGEN_COSECHA_DISPONIBLE = '/images/landing-finca.jpg';

export interface CosechaDisponible {
  id: string;
  finca: string;
  zona: ZonaCafetalera;
  ubicacion: string;
  variedad: string;
  proceso: ProcesoCosecha;
  notas: string[];
  precioDesdeKg: number;
  disponibilidad: DisponibilidadCosecha;
  imagenUrl: string;
}

export interface CosechaDisponibleApi {
  id: string;
  fincaId: string;
  finca: string;
  zona: ZonaCafetalera;
  canton: string;
  provincia: string;
  variedad: string;
  proceso: ProcesoCosecha;
  notas: string[];
  precioKg: number;
}

export interface FiltrosCosechas {
  soloDisponibles: boolean;
  zona: ZonaCafetalera | null;
  variedad: string | null;
  rangoPrecio: RangoPrecioCosecha | null;
  soloFlorales: boolean;
  soloHoney: boolean;
}

export const SIN_FILTROS: FiltrosCosechas = {
  soloDisponibles: false,
  zona: null,
  variedad: null,
  rangoPrecio: null,
  soloFlorales: false,
  soloHoney: false,
};
