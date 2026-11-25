export const CATEGORIAS_MENU = ['Café', 'Otra comida'] as const;

export type CategoriaMenu = (typeof CATEGORIAS_MENU)[number];

export type CategoriaMenuApi = 'CAFE' | 'OTRA_COMIDA';

export interface ItemMenu {
  id: string;
  nombre: string;
  categoria: CategoriaMenu;
  codigoTrazabilidad: string | null;
  precio: number;
}

export type NuevoItemMenu = Omit<ItemMenu, 'id'>;

export interface ItemMenuResponseApi {
  id: string;
  nombre: string;
  categoria: CategoriaMenuApi;
  codigoTrazabilidad: string | null;
  precio: number;
}

export interface PublicarItemMenuRequestApi {
  nombre: string;
  categoria: CategoriaMenuApi;
  codigoTrazabilidad: string | null;
  precio: number;
}
