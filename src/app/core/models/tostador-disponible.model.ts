import { EstiloTueste } from './negocio-tueste.model';
import { NivelTuesteApi } from './tueste.model';

export interface TostadorDisponible {
  id: string;
  nombre: string;
  ubicacion: string;
  estilos: EstiloTueste[];
  kgDisponibles: number;
}

export interface FiltrosTostadores {
  estilo: EstiloTueste | null;
  soloConCafe: boolean;
}

export const SIN_FILTROS: FiltrosTostadores = {
  estilo: null,
  soloConCafe: false,
};

export interface TostadorExploracionApi {
  id: string;
  nombre: string;
  canton: string;
  provincia: string;
  estilos: NivelTuesteApi[];
  kgDisponibles: number;
}
