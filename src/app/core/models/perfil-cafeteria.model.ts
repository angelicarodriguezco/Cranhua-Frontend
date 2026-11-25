import { Coordenada } from './finca.model';
import { EnlacePerfilApi } from './menu-publico.model';
import { EnlacePerfilPublico } from './perfil-tostador.model';
import { NivelTuesteApi } from './tueste.model';

export interface PerfilCafeteria {
  id: string;
  nombre: string;
  ubicacion: string;
  descripcion: string;
  coordenada: Coordenada;
  cafesTrazables: number;
  tostadores: EnlacePerfilPublico[];
  horario: string;
  miembroDesde: string;
  fincas: EnlacePerfilPublico[];
  portadaUrl?: string | null;
}

export interface PerfilCafeteriaResponseApi {
  id: string;
  nombre: string;
  descripcion?: string | null;
  horario?: string | null;
  canton: string;
  provincia: string;
  ubicacion: Coordenada;
  estilos: NivelTuesteApi[];
  portadaUrl?: string | null;
  miembroDesde: string;
  cafesTrazables: number;
  fincas: EnlacePerfilApi[];
  tostadores: EnlacePerfilApi[];
}
