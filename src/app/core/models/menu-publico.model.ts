import { EnlacePerfilPublico } from './perfil-tostador.model';

export interface CafeMenuPublico {
  id: string;
  nombre: string;
  nivelTueste: string;
  notas: string;
  precio: number;
  fincaOrigen: EnlacePerfilPublico;
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
