import {
  CategoriaMenu,
  CategoriaMenuApi,
  ItemMenu,
  ItemMenuResponseApi,
  NuevoItemMenu,
  PublicarItemMenuRequestApi,
} from '../models/menu-cafeteria.model';

const CATEGORIA_A_API: Record<CategoriaMenu, CategoriaMenuApi> = {
  Café: 'CAFE',
  'Otra comida': 'OTRA_COMIDA',
};

const CATEGORIA_DESDE_API: Record<CategoriaMenuApi, CategoriaMenu> = {
  CAFE: 'Café',
  OTRA_COMIDA: 'Otra comida',
};

export function categoriaMenuHaciaApi(categoria: CategoriaMenu): CategoriaMenuApi {
  return CATEGORIA_A_API[categoria];
}

export function categoriaMenuDesdeApi(categoria: CategoriaMenuApi): CategoriaMenu {
  return CATEGORIA_DESDE_API[categoria];
}

export function itemMenuDesdeApi(api: ItemMenuResponseApi): ItemMenu {
  return {
    id: api.id,
    nombre: api.nombre,
    categoria: categoriaMenuDesdeApi(api.categoria),
    codigoTrazabilidad: api.codigoTrazabilidad,
    precio: Number(api.precio),
  };
}

export function cuerpoPublicarItemMenu(nuevo: NuevoItemMenu): PublicarItemMenuRequestApi {
  return {
    nombre: nuevo.nombre,
    categoria: categoriaMenuHaciaApi(nuevo.categoria),
    codigoTrazabilidad: nuevo.codigoTrazabilidad,
    precio: nuevo.precio,
  };
}
