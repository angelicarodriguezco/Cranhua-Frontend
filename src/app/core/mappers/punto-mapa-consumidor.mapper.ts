import {
  PuntoMapaConsumidor,
  PuntoMapaResponseApi,
  TipoPuntoMapaApi,
  TipoPuntoMapaConsumidor,
} from '../models/punto-mapa-consumidor.model';

const TIPO_API_A_UI: Record<TipoPuntoMapaApi, TipoPuntoMapaConsumidor> = {
  FINCA: 'finca',
  TOSTADOR: 'tostador',
  CAFETERIA: 'cafeteria',
};

export function mapearTipoPuntoMapaDesdeApi(tipo: TipoPuntoMapaApi): TipoPuntoMapaConsumidor {
  return TIPO_API_A_UI[tipo];
}

export function ubicacionLabelDesdeApi(canton: string, provincia: string): string {
  const cantonLimpio = canton?.trim() ?? '';
  const provinciaLimpia = provincia?.trim() ?? '';
  if (!provinciaLimpia || provinciaLimpia === cantonLimpio) {
    return cantonLimpio;
  }
  return `${cantonLimpio}, ${provinciaLimpia}`;
}

export function mapearPuntoMapaResponseAConsumidor(api: PuntoMapaResponseApi): PuntoMapaConsumidor {
  return {
    id: api.id,
    tipo: mapearTipoPuntoMapaDesdeApi(api.tipo),
    nombre: api.nombre,
    ubicacionLabel: ubicacionLabelDesdeApi(api.canton, api.provincia),
    coordenada: api.coordenada,
  };
}
