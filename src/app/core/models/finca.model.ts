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
  zona: ZonaCafetalera;
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

export type NuevaFinca = Omit<Finca, 'id'>;

// Misma forma que el 409 del backend
export interface ConflictoFinca {
  fincaId: string;
  nombre: string;
  duenos: { id: string; nombreCompleto: string }[];
  perimetro: Coordenada[];
}

export type ResultadoRegistro =
  | { registrada: true; finca: Finca }
  | { registrada: false; conflicto: ConflictoFinca; mensaje: string };

export type ErrorAgregarDueno = 'finca-inexistente' | 'correo-inexistente' | 'ya-es-dueno';

export type ResultadoAgregarDueno =
  | { agregado: true; finca: Finca }
  | { agregado: false; error: ErrorAgregarDueno };
