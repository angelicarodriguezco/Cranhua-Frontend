import { EnlacePerfilApi } from './menu-publico.model';
import { EstiloTueste } from './negocio-tueste.model';
import { NivelTuesteApi } from './tueste.model';

export interface EnlacePerfilPublico {
  id: string;
  nombre: string;
  ubicacion: string;
}

export interface PerfilTostador {
  id: string;
  nombre: string;
  ubicacion: string;
  descripcion: string;
  estilos: EstiloTueste[];
  portadaUrl: string | null;
  miembroDesde: string;
  fincas: EnlacePerfilPublico[];
  puntosVenta: EnlacePerfilPublico[];
}

export interface PerfilTostadorResponseApi {
  id: string;
  nombre: string;
  descripcion?: string | null;
  canton: string;
  provincia: string;
  estilos: NivelTuesteApi[];
  portadaUrl?: string | null;
  miembroDesde: string;
  fincas: EnlacePerfilApi[];
  puntosVenta: EnlacePerfilApi[];
}
