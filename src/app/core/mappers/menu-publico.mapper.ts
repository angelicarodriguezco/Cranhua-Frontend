import { nivelTuesteDesdeApi } from './tueste.mapper';
import { ubicacionLabelDesdeApi } from './punto-mapa-consumidor.mapper';
import {
  CafeMenuPublico,
  CafeMenuPublicoApi,
  ComidaMenuPublico,
  ComidaMenuPublicoApi,
  EnlacePerfilApi,
  MenuPublico,
  MenuPublicoResponseApi,
} from '../models/menu-publico.model';
import { EnlacePerfilPublico } from '../models/perfil-tostador.model';
import { NivelTuesteApi } from '../models/tueste.model';

export function enlacePerfilDesdeApi(api: EnlacePerfilApi): EnlacePerfilPublico {
  return {
    id: api.id,
    nombre: api.nombre,
    ubicacion: ubicacionLabelDesdeApi(api.canton, api.provincia),
  };
}

export function notasMenuDesdeApi(notas: string[] | null | undefined): string {
  return (notas ?? [])
    .map((nota) => nota.trim())
    .filter(Boolean)
    .join(', ');
}

export function nivelTuesteMenuDesdeApi(
  nivel: NivelTuesteApi | null | undefined,
): string {
  return nivel ? nivelTuesteDesdeApi(nivel) : '';
}

export function idItemMenuPublico(nombre: string, precio: number, indice: number): string {
  return `${nombre}-${precio}-${indice}`;
}

export function cafeMenuPublicoDesdeApi(
  api: CafeMenuPublicoApi,
  indice: number,
): CafeMenuPublico {
  return {
    id: idItemMenuPublico(api.nombre, Number(api.precio), indice),
    nombre: api.nombre,
    nivelTueste: nivelTuesteMenuDesdeApi(api.nivelTueste),
    notas: notasMenuDesdeApi(api.notas),
    precio: Number(api.precio),
    fincaOrigen: api.fincaOrigen ? enlacePerfilDesdeApi(api.fincaOrigen) : null,
  };
}

export function comidaMenuPublicoDesdeApi(
  api: ComidaMenuPublicoApi,
  indice: number,
): ComidaMenuPublico {
  return {
    id: idItemMenuPublico(api.nombre, Number(api.precio), indice),
    nombre: api.nombre,
    precio: Number(api.precio),
  };
}

export function menuPublicoDesdeApi(api: MenuPublicoResponseApi): MenuPublico {
  return {
    cafeteriaId: api.id,
    nombre: api.nombre,
    ubicacion: ubicacionLabelDesdeApi(api.canton, api.provincia),
    cafes: (api.cafes ?? []).map(cafeMenuPublicoDesdeApi),
    otrasComidas: (api.otrasComidas ?? []).map(comidaMenuPublicoDesdeApi),
  };
}
