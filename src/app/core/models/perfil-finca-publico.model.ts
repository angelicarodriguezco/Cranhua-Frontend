import { Coordenada } from './finca.model';

export interface CosechaActivaPublica {
  id: string;
  codigo: string;
  variedad: string;
  proceso: string;
  kilos: number;
}

export interface CafeteriaVinculadaPublica {
  id: string;
  nombre: string;
  ubicacionLabel: string;
  rutaPerfil: string;
}

export interface PerfilFincaPublico {
  id: string;
  nombre: string;
  ubicacionLabel: string;
  descripcion: string;
  etiqueta: 'Finca cafetalera';
  propietario: string;
  altitudMsnm: number;
  variedades: string[];
  procesos: string[];
  enCranhuaDesde: string;
  cosechaActiva: CosechaActivaPublica;
  coordenada: Coordenada;
  cafeterias: CafeteriaVinculadaPublica[];
  imagenPortada?: string;
}
