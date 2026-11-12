import { Canton, Coordenada } from './finca.model';

export const VOLUMENES_MENSUALES = [
  'Menos de 10 kg',
  '10 – 25 kg',
  '25 – 50 kg',
  '50 – 100 kg',
  'Más de 100 kg',
] as const;

export type VolumenMensual = (typeof VOLUMENES_MENSUALES)[number];

export const ESTILOS_CAFE = ['Claro', 'Medio', 'Oscuro'] as const;

export type EstiloCafe = (typeof ESTILOS_CAFE)[number];

export type CantonReferencia = Pick<Canton, 'nombre' | 'provincia' | 'cabecera'>;

export interface Cafeteria {
  id: string;
  nombre: string;
  contacto: string;
  telefono: string;
  correo: string;
  descripcion: string | null;
  horario: string | null;
  ubicacion: Coordenada;
  canton: CantonReferencia | null;
  volumenMensual: VolumenMensual | null;
  estilos: EstiloCafe[];
  propietarioId: string;
  portadaUrl?: string | null;
}

export type NuevaCafeteria = Omit<Cafeteria, 'id'>;

export type EstiloCafeApi = 'CLARO' | 'MEDIO' | 'OSCURO';

export type VolumenMensualApi =
  | 'MENOS_DE_10'
  | 'DE_10_A_25'
  | 'DE_25_A_50'
  | 'DE_50_A_100'
  | 'MAS_DE_100';

export interface CafeteriaResponseApi {
  id: string;
  cuentaId: string;
  nombre: string;
  nombreContacto: string;
  telefono: string;
  correo: string;
  descripcion: string | null;
  horario: string | null;
  ubicacion: Coordenada;
  canton: string;
  provincia: string;
  estilos: EstiloCafeApi[];
  volumenMensual: VolumenMensualApi | null;
  portadaUrl: string | null;
}

export interface CafeteriaRegistroApi {
  nombre: string;
  nombreContacto: string;
  telefono: string;
  correo: string;
  descripcion: string | null;
  horario: string | null;
  ubicacion: Coordenada;
  canton: string;
  provincia: string;
  estilos: EstiloCafeApi[];
  volumenMensual: VolumenMensualApi | null;
  portadaUrl: string | null;
}
