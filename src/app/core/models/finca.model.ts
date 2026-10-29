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

export type ResultadoRegistro =
  | { registrada: true; finca: Finca }
  | { registrada: false; conflicto: Finca };
