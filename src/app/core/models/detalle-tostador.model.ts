import { EstiloTueste } from './negocio-tueste.model';
import { TostadorDisponible } from './tostador-disponible.model';

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
