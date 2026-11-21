import { EstiloTueste } from '../models/negocio-tueste.model';
import {
  ActualizarTuesteRequestApi,
  EstadoTrazabilidadApi,
  FichaCodigoApi,
  IndicadoresLotes,
  IndicadoresLotesApi,
  LoteComprado,
  LoteCompradoApi,
  LotesComprados,
  LotesCompradosResponseApi,
  NivelTuesteApi,
  NuevoTueste,
  RegistrarTuesteRequestApi,
  Tueste,
  TuesteApi,
} from '../models/tueste.model';

const NIVEL_A_API: Record<EstiloTueste, NivelTuesteApi> = {
  Claro: 'CLARO',
  Medio: 'MEDIO',
  Oscuro: 'OSCURO',
};

const NIVEL_DESDE_API: Record<NivelTuesteApi, EstiloTueste> = {
  CLARO: 'Claro',
  MEDIO: 'Medio',
  OSCURO: 'Oscuro',
};

export function nivelTuesteHaciaApi(nivel: EstiloTueste): NivelTuesteApi {
  return NIVEL_A_API[nivel];
}

export function nivelTuesteDesdeApi(nivel: NivelTuesteApi): EstiloTueste {
  return NIVEL_DESDE_API[nivel];
}

export function codigoTrazabilidadDesdeEstado(
  codigo: string,
  estado: EstadoTrazabilidadApi,
): string | null {
  return estado === 'ACTIVO' ? codigo : null;
}

export function indicadoresLotesDesdeApi(api: IndicadoresLotesApi): IndicadoresLotes {
  return {
    lotes: api.lotesComprados,
    kg: api.kgComprados,
    conCodigo: api.lotesConCodigo,
  };
}

export function loteCompradoDesdeApi(api: LoteCompradoApi): LoteComprado {
  return {
    id: api.id,
    codigoLote: api.codigo,
    finca: api.finca,
    variedad: api.variedad,
    proceso: null,
    kg: api.kg,
    fechaCompra: api.fechaCompra,
    codigoTrazabilidad: codigoTrazabilidadDesdeEstado(api.codigo, api.estado),
  };
}

export function lotesCompradosDesdeApi(api: LotesCompradosResponseApi): LotesComprados {
  return {
    indicadores: indicadoresLotesDesdeApi(api.indicadores),
    lotes: api.lotes.map(loteCompradoDesdeApi),
  };
}

export function loteCompradoDesdeFicha(
  ficha: FichaCodigoApi,
  base?: Pick<LoteComprado, 'fechaCompra' | 'proceso'>,
): LoteComprado {
  return {
    id: ficha.id,
    codigoLote: ficha.codigo,
    finca: ficha.finca,
    variedad: ficha.variedad,
    proceso: base?.proceso ?? null,
    kg: ficha.kg,
    fechaCompra: base?.fechaCompra ?? '',
    codigoTrazabilidad: codigoTrazabilidadDesdeEstado(ficha.codigo, ficha.estado),
  };
}

export function tuesteDesdeApi(api: TuesteApi, codigoLoteFallback = ''): Tueste {
  const codigoLote = api.codigoLote ?? codigoLoteFallback;
  return {
    id: api.id,
    loteId: api.loteId,
    nivel: nivelTuesteDesdeApi(api.nivel),
    pesoVerdeKg: api.pesoVerdeKg,
    pesoTostadoKg: api.pesoTostadoKg,
    fecha: api.fechaTueste,
    notas: api.notas,
    codigoTrazabilidad: codigoLote,
  };
}

export function cuerpoRegistrarTueste(nuevo: NuevoTueste): RegistrarTuesteRequestApi {
  return {
    loteId: nuevo.loteId,
    nivel: nivelTuesteHaciaApi(nuevo.nivel),
    pesoVerdeKg: nuevo.pesoVerdeKg,
    pesoTostadoKg: nuevo.pesoTostadoKg,
    fechaTueste: nuevo.fecha,
    notas: nuevo.notas,
  };
}

export function cuerpoActualizarTueste(
  cambios: Omit<NuevoTueste, 'loteId'>,
): ActualizarTuesteRequestApi {
  return {
    nivel: nivelTuesteHaciaApi(cambios.nivel),
    pesoVerdeKg: cambios.pesoVerdeKg,
    pesoTostadoKg: cambios.pesoTostadoKg,
    fechaTueste: cambios.fecha,
    notas: cambios.notas,
  };
}
