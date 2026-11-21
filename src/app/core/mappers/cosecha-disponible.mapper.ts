import {
  CosechaDisponible,
  CosechaDisponibleApi,
  IMAGEN_COSECHA_DISPONIBLE,
} from '../models/cosecha-disponible.model';
import {
  DetalleCosecha,
  DetalleCosechaDisponibleApi,
  ProductorCosechaApi,
} from '../models/detalle-cosecha.model';
import { Usuario } from '../models/finca.model';

export function ubicacionCosechaDesdeApi(canton: string, provincia: string): string {
  return `${canton}, ${provincia}`;
}

export function usuarioDesdeProductorApi(api: ProductorCosechaApi): Usuario {
  const partes = api.nombreCompleto.trim().split(/\s+/).filter(Boolean);
  const nombre = partes[0] ?? '';
  const apellidos = partes.slice(1).join(' ');
  return {
    id: api.id,
    nombre,
    apellidos,
    correo: api.correo,
  };
}

function descripcionDesdeDetalleApi(api: DetalleCosechaDisponibleApi): string {
  const partes: string[] = [];
  if (api.codigoLote) {
    partes.push(`Lote ${api.codigoLote}`);
  }
  if (api.puntajeSca != null) {
    partes.push(`SCA ${api.puntajeSca}`);
  }
  return partes.join(' · ');
}

export function cosechaDisponibleDesdeApi(api: CosechaDisponibleApi): CosechaDisponible {
  return {
    id: api.id,
    finca: api.finca,
    zona: api.zona,
    ubicacion: ubicacionCosechaDesdeApi(api.canton, api.provincia),
    variedad: api.variedad,
    proceso: api.proceso,
    notas: api.notas ?? [],
    precioDesdeKg: Number(api.precioKg),
    disponibilidad: 'Disponible',
    imagenUrl: IMAGEN_COSECHA_DISPONIBLE,
  };
}

export function detalleCosechaDesdeApi(api: DetalleCosechaDisponibleApi): DetalleCosecha {
  const productorApi = api.productores[0];
  return {
    ...cosechaDisponibleDesdeApi(api),
    altitudMsnm: api.alturaMsnm ?? 0,
    kgDisponibles: Number(api.kgDisponibles),
    precioKg: Number(api.precioKg),
    descripcion: descripcionDesdeDetalleApi(api),
    productor: productorApi
      ? usuarioDesdeProductorApi(productorApi)
      : { id: '', nombre: '', apellidos: '', correo: '' },
  };
}
