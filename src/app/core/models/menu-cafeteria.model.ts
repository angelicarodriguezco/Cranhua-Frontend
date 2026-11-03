export const CATEGORIAS_MENU = ['Café', 'Otra comida'] as const;

export type CategoriaMenu = (typeof CATEGORIAS_MENU)[number];

export interface ItemMenu {
  id: string;
  nombre: string;
  categoria: CategoriaMenu;
  codigoTrazabilidad: string | null;
  precio: number;
}

export type NuevoItemMenu = Omit<ItemMenu, 'id'>;
