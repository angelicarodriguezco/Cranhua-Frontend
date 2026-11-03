import { ItemMenu } from '../models/menu-cafeteria.model';

export const MENU_CAFETERIA: ItemMenu[] = [
  {
    id: 'menu-1',
    nombre: 'Espresso Tarrazú',
    categoria: 'Café',
    codigoTrazabilidad: 'CRH-2026-0101-T01',
    precio: 1800,
  },
  {
    id: 'menu-2',
    nombre: 'Capuchino Naranjo',
    categoria: 'Café',
    codigoTrazabilidad: 'CRH-2026-0102-T01',
    precio: 2400,
  },
  {
    id: 'menu-3',
    nombre: 'Chorreado Los Robles',
    categoria: 'Café',
    codigoTrazabilidad: 'TRZ-0101-MC',
    precio: 2000,
  },
  {
    id: 'menu-4',
    nombre: 'Queque de naranja',
    categoria: 'Otra comida',
    codigoTrazabilidad: null,
    precio: 1500,
  },
  {
    id: 'menu-5',
    nombre: 'Empanada de queso',
    categoria: 'Otra comida',
    codigoTrazabilidad: null,
    precio: 1200,
  },
];
