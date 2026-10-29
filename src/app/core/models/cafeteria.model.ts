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
  volumenMensual: VolumenMensual;
  estilos: EstiloCafe[];
  propietarioId: string;
}

export type NuevaCafeteria = Omit<Cafeteria, 'id'>;
