export interface Coordenada {
  lat: number;
  lng: number;
}

export const ESTILOS_TUESTE = ['Claro', 'Medio', 'Oscuro'] as const;

export type EstiloTueste = (typeof ESTILOS_TUESTE)[number];

export interface Tostador {
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
}

export interface Canton {
  nombre: string;
  provincia: string;
  cabecera: Coordenada;
}

export interface NegocioTueste {
  id: string;
  nombre: string;
  descripcion: string | null;
  contacto: string;
  telefono: string;
  correo: string;
  ubicacion: Coordenada;
  canton: Canton;
  estilos: EstiloTueste[];
  propietarioId: string;
}

export type NuevoNegocioTueste = Omit<NegocioTueste, 'id'>;
