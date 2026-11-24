import { estadoCosechaDesdeApi } from './dashboard-cafetalero.mapper';
import {
  CosechaHistorial,
  CosechaHistorialApi,
  HistorialCafetalero,
  HistorialCafetaleroResponseApi,
  IndicadoresHistorial,
  IndicadoresHistorialApi,
  LoteVendido,
  LoteVendidoApi,
  Pagina,
} from '../models/historial-cafetalero.model';

export function indicadoresHistorialDesdeApi(api: IndicadoresHistorialApi): IndicadoresHistorial {
  return {
    cosechasRegistradas: api.cosechasRegistradas,
    produccionTotalKg: Number(api.produccionTotalKg),
    lotesVendidos: api.lotesVendidos,
  };
}

export function cosechaHistorialDesdeApi(api: CosechaHistorialApi): CosechaHistorial {
  return {
    id: api.id,
    fincaId: api.fincaId,
    finca: api.finca,
    variedad: api.variedad,
    fechaInicio: api.fechaInicio,
    fechaFin: api.fechaFin,
    cantidadCosechadaKg: Number(api.cantidadCosechadaKg),
    estado: estadoCosechaDesdeApi(api.estado),
  };
}

export function loteVendidoDesdeApi(api: LoteVendidoApi): LoteVendido {
  return {
    id: api.id,
    codigo: api.codigo,
    cosechaId: api.cosechaId,
    fincaId: api.fincaId,
    finca: api.finca,
    variedad: api.variedad,
    comprador: api.comprador,
    kg: Number(api.kg),
    precioKg: Number(api.precioKg),
    total: Number(api.total),
    vendidoEn: api.vendidoEn,
  };
}

export function paginaDesdeApi<TApi, TUi>(
  api: Pagina<TApi>,
  mapear: (item: TApi) => TUi,
): Pagina<TUi> {
  return {
    contenido: api.contenido.map(mapear),
    pagina: api.pagina,
    tamano: api.tamano,
    totalElementos: api.totalElementos,
    totalPaginas: api.totalPaginas,
  };
}

export function historialCafetaleroDesdeApi(
  api: HistorialCafetaleroResponseApi,
): HistorialCafetalero {
  return {
    indicadores: indicadoresHistorialDesdeApi(api.indicadores),
    cosechas: api.cosechas.contenido.map(cosechaHistorialDesdeApi),
    lotesVendidos: api.lotesVendidos.contenido.map(loteVendidoDesdeApi),
  };
}
