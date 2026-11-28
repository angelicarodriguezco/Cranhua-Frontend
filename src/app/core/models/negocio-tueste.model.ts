import { HistorialTrazabilidad } from './historial-trazabilidad.model';
import { NivelTuesteApi } from './tueste.model';

export interface Coordenada {
  lat: number;
  lng: number;
}

export const ESTILOS_TUESTE = ['Claro', 'Medio', 'Oscuro'] as const;

export type EstiloTueste = (typeof ESTILOS_TUESTE)[number];

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
  // El backend guarda el cantón, no el punto exacto del pin
  canton: Pick<Canton, 'nombre' | 'provincia'>;
  estilos: EstiloTueste[];
  portadaUrl: string | null;
  historialTrazabilidad?: HistorialTrazabilidad | null;
}

export type DatosNegocioTueste = Omit<NegocioTueste, 'id' | 'portadaUrl' | 'historialTrazabilidad'>;

export interface NegocioTuesteApi {
  id: string;
  cuentaId: string;
  nombre: string;
  nombreContacto: string;
  telefono: string;
  correo: string;
  descripcion: string | null;
  canton: string;
  provincia: string;
  estilos: NivelTuesteApi[];
  portadaUrl: string | null;
  historialTrazabilidad?: HistorialTrazabilidad;
}

export type NegocioTuesteRequestApi = Omit<
  NegocioTuesteApi,
  'id' | 'cuentaId' | 'portadaUrl' | 'descripcion' | 'historialTrazabilidad'
> & { descripcion: string };
