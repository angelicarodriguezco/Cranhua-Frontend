export interface Coordenada {
  lat: number;
  lng: number;
}

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

export interface CantonResponseApi {
  id: number;
  nombre: string;
  provincia: string;
  zonaCafetalera: ZonaCafetalera | null;
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
  cosechasActivas?: number;
  kgDisponibles?: number;
  historialTrazabilidad?: HistorialTrazabilidad;
}

export interface HistorialTrazabilidad {
  tieneHistorial: boolean;
  codigoEjemplo: string | null;
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
  cosechasActivas?: number;
  kgDisponibles?: number;
  // Solo viene en GET /api/fincas/{id}
  historialTrazabilidad?: HistorialTrazabilidad;
}

export interface ConflictoFinca {
  fincaId: string;
  nombre: string;
  duenos: DuenoApi[];
  perimetro: Coordenada[];
}

export type ResultadoRegistro =
  | { registrada: true; finca: Finca }
  | { registrada: false; conflicto: ConflictoFinca; mensaje: string };

export interface ErrorRegistroFinca {
  mensaje: string;
  errores: Record<string, string>;
  estado?: number;
}

// El backend solo cambia los campos que vienen en el cuerpo
export type CambiosFinca = Partial<
  Pick<
    FincaResponseApi,
    'nombre' | 'descripcion' | 'zonaCafetalera' | 'perimetro' | 'ubicacion' | 'canton' | 'provincia'
  >
>;

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
