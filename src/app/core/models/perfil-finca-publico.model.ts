import { Coordenada, ZonaCafetalera } from './finca.model';
import { EnlacePerfilApi } from './menu-publico.model';
import { EnlacePerfilPublico } from './perfil-tostador.model';

export interface CosechaActivaPublica {
  id: string;
  codigo: string;
  variedad: string;
  proceso: string;
  alturaMsnm: number | null;
  kgDisponibles: number;
}

export interface PerfilFincaPublico {
  id: string;
  nombre: string;
  ubicacion: string;
  descripcion: string;
  zona: ZonaCafetalera | null;
  propietarios: string[];
  variedades: string[];
  procesos: string[];
  enCranhuaDesde: string;
  cosechasActivas: CosechaActivaPublica[];
  cafeterias: EnlacePerfilPublico[];
}

export interface CosechaActivaPublicaApi {
  id: string;
  codigoLote: string;
  variedad: string;
  proceso: string;
  alturaMsnm?: number | null;
  kgDisponibles: number;
}

export interface PerfilFincaPublicoResponseApi {
  id: string;
  nombre: string;
  descripcion?: string | null;
  zonaCafetalera?: ZonaCafetalera | null;
  canton: string;
  provincia: string;
  ubicacion: Coordenada;
  perimetro: Coordenada[];
  propietarios: string[];
  variedades: string[];
  procesos: string[];
  enCranhuaDesde: string;
  cosechasActivas: CosechaActivaPublicaApi[];
  cafeterias: EnlacePerfilApi[];
}
