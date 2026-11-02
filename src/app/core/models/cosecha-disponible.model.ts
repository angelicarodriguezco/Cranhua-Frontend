import { ZonaCafetalera } from './finca.model';

export type ProcesoCosecha = 'Lavado' | 'Honey' | 'Natural';

export type DisponibilidadCosecha = 'Disponible' | 'Próximamente';

// Notas de catación que cuentan para el filtro "Notas florales"
export const NOTAS_FLORALES = ['Azahar', 'Flor de café', 'Hibisco', 'Jazmín', 'Lavanda', 'Rosa'];

// Cosecha publicada por un cafetalero, tal como la ve un tostador
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
}

export interface FiltrosCosechas {
  soloDisponibles: boolean;
  zona: ZonaCafetalera | null;
  soloFlorales: boolean;
  soloHoney: boolean;
}

export const SIN_FILTROS: FiltrosCosechas = {
  soloDisponibles: false,
  zona: null,
  soloFlorales: false,
  soloHoney: false,
};
