import { EstiloTueste } from './negocio-tueste.model';
import { TostadorDisponible } from './tostador-disponible.model';
import { NivelTuesteApi } from './tueste.model';

export interface TuesteDisponible {
  id: string;
  finca: string;
  variedad: string;
  nivel: EstiloTueste;
  kgDisponibles: number;
}

export interface ContactoTostador {
  nombre: string;
  telefono: string;
  correo: string;
}

export interface DetalleTostador extends TostadorDisponible {
  descripcion: string;
  contacto: ContactoTostador;
  tuestes: TuesteDisponible[];
}

export interface DetalleTostadorApi {
  id: string;
  nombre: string;
  nombreContacto: string;
  telefono: string;
  correo: string;
  descripcion: string | null;
  canton: string;
  provincia: string;
  estilos: NivelTuesteApi[];
  portadaUrl: string | null;
  tuestes: TuesteDisponibleApi[];
}

export interface TuesteDisponibleApi {
  id: string;
  fincaOrigen: string;
  variedad: string;
  nivel: NivelTuesteApi;
  kgDisponibles: number;
}
