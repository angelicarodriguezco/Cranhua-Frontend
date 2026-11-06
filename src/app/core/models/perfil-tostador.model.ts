import { Coordenada } from './finca.model';

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
  coordenada: Coordenada;
  estilosTueste: string[];
  kgTostadosAnio: number;
  miembroDesde: string;
  fincas: EnlacePerfilPublico[];
  puntosVenta: EnlacePerfilPublico[];
}
