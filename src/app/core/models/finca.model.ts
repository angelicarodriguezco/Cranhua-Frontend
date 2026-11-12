export interface Coordenada {
  lat: number;
  lng: number;
}

// Regiones cafetaleras del ICAFE
export const ZONAS_CAFETALERAS = [
  'Tarrazú',
  'Valle Central',
  'Valle Occidental',
  'Tres Ríos',
  'Orosi',
  'Turrialba',
  'Brunca',
  'Guanacaste',
] as const;

export type ZonaCafetalera = (typeof ZONAS_CAFETALERAS)[number];

export interface Usuario {
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
}

export interface Canton {
  nombre: string;
  provincia: string;
  zona: ZonaCafetalera | null;
  cabecera: Coordenada;
}

export interface Finca {
  id: string;
  nombre: string;
  descripcion: string | null;
  zona: ZonaCafetalera | null;
  perimetro: Coordenada[];
  ubicacion: Coordenada;
  canton: Canton | null;
  areaHectareas: number;
  propietarioId: string;
  duenosAdicionales: Usuario[];
}

export type NuevaFinca = Pick<
  Finca,
  'nombre' | 'descripcion' | 'zona' | 'perimetro' | 'ubicacion' | 'canton'
>;

export interface DuenoApi {
  id: string;
  nombreCompleto: string;
}

export interface FincaResponseApi {
  id: string;
  nombre: string;
  descripcion: string | null;
  zonaCafetalera: ZonaCafetalera | null;
  perimetro: Coordenada[];
  ubicacion: Coordenada;
  canton: string;
  provincia: string;
  areaHectareas: number;
  duenos: DuenoApi[];
}

// Misma forma que el 409 del backend
export interface ConflictoFinca {
  fincaId: string;
  nombre: string;
  duenos: DuenoApi[];
  perimetro: Coordenada[];
}

export type ResultadoRegistro =
  | { registrada: true; finca: Finca }
  | { registrada: false; conflicto: ConflictoFinca; mensaje: string };

// 400 con los mensajes por campo, o un error genérico
export interface ErrorRegistroFinca {
  mensaje: string;
  errores: Record<string, string>;
}

export interface DuenoFallido {
  correo: string;
  mensaje: string;
}

export type ResultadoRegistroConDuenos =
  | { registrada: true; finca: Finca; duenosFallidos: DuenoFallido[] }
  | Extract<ResultadoRegistro, { registrada: false }>;

export type ResultadoAgregarDueno =
  | { agregado: true; finca: Finca }
  | { agregado: false; mensaje: string };
