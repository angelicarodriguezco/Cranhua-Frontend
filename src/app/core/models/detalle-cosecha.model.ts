import { CosechaDisponible } from './cosecha-disponible.model';
import { Usuario } from './finca.model';

export interface DetalleCosecha extends CosechaDisponible {
  altitudMsnm: number;
  kgDisponibles: number;
  precioKg: number;
  descripcion: string;
  productor: Usuario;
}

export interface NuevaSolicitud {
  cosechaId: string;
  kilos: number;
  precioKg: number;
}
