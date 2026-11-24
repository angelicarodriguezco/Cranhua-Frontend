import {
  CosechaDisponible,
  CosechaDisponibleApi,
  ProcesoCosecha,
} from './cosecha-disponible.model';
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

export interface ProductorCosechaApi {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string | null;
}

export interface ProcesoRepartoApi {
  proceso: ProcesoCosecha;
  porcentaje: number;
}

export interface DetalleCosechaDisponibleApi extends CosechaDisponibleApi {
  procesos: ProcesoRepartoApi[];
  alturaMsnm: number | null;
  kgDisponibles: number;
  puntajeSca: number | null;
  codigoLote: string | null;
  productores: ProductorCosechaApi[];
}
