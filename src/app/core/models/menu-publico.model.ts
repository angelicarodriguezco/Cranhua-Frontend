import { Coordenada } from './finca.model';
import { EnlacePerfilPublico } from './perfil-tostador.model';
import { NivelTuesteApi } from './tueste.model';

export interface CafeMenuPublico {
  id: string;
  nombre: string;
  nivelTueste: string;
  notas: string;
  precio: number;
  fincaOrigen?: EnlacePerfilPublico | null;
}

export interface ComidaMenuPublico {
  id: string;
  nombre: string;
  precio: number;
}

export interface MenuPublico {
  cafeteriaId: string;
  nombre: string;
  ubicacion: string;
  cafes: CafeMenuPublico[];
  otrasComidas: ComidaMenuPublico[];
}

export interface EnlacePerfilApi {
  id: string;
  nombre: string;
  canton: string;
  provincia: string;
}

export interface CafeMenuPublicoApi {
  nombre: string;
  precio: number;
  nivelTueste?: NivelTuesteApi | null;
  notas?: string[] | null;
  fincaOrigen?: EnlacePerfilApi | null;
}

export interface ComidaMenuPublicoApi {
  nombre: string;
  precio: number;
}

export interface MenuPublicoResponseApi {
  id: string;
  nombre: string;
  canton: string;
  provincia: string;
  ubicacion: Coordenada;
  cafes: CafeMenuPublicoApi[];
  otrasComidas: ComidaMenuPublicoApi[];
}
