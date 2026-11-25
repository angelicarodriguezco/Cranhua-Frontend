import { ItemMenuResponseApi, NuevoItemMenu } from '../models/menu-cafeteria.model';
import {
  categoriaMenuDesdeApi,
  categoriaMenuHaciaApi,
  cuerpoPublicarItemMenu,
  itemMenuDesdeApi,
} from './menu-cafeteria.mapper';

describe('menu-cafeteria.mapper', () => {
  it('mapea categoría UI ↔ API', () => {
    expect(categoriaMenuHaciaApi('Café')).toBe('CAFE');
    expect(categoriaMenuHaciaApi('Otra comida')).toBe('OTRA_COMIDA');

    expect(categoriaMenuDesdeApi('CAFE')).toBe('Café');
    expect(categoriaMenuDesdeApi('OTRA_COMIDA')).toBe('Otra comida');
  });

  it('mapea ItemMenuResponseApi a ItemMenu', () => {
    const api: ItemMenuResponseApi = {
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      nombre: 'Espresso Tarrazú',
      categoria: 'CAFE',
      codigoTrazabilidad: 'CRH-2026-0101-T01',
      precio: 1800,
    };

    expect(itemMenuDesdeApi(api)).toEqual({
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      nombre: 'Espresso Tarrazú',
      categoria: 'Café',
      codigoTrazabilidad: 'CRH-2026-0101-T01',
      precio: 1800,
    });
  });

  it('convierte precio numérico cuando viene como string del BigDecimal', () => {
    const api = {
      id: 'item-1',
      nombre: 'Queque',
      categoria: 'OTRA_COMIDA' as const,
      codigoTrazabilidad: null,
      precio: '1500.00' as unknown as number,
    };

    expect(itemMenuDesdeApi(api).precio).toBe(1500);
  });

  it('arma el cuerpo de publicar con categoría API', () => {
    const nuevo: NuevoItemMenu = {
      nombre: 'Latte',
      categoria: 'Café',
      codigoTrazabilidad: 'CRH-2026-0098-T01',
      precio: 2600,
    };

    expect(cuerpoPublicarItemMenu(nuevo)).toEqual({
      nombre: 'Latte',
      categoria: 'CAFE',
      codigoTrazabilidad: 'CRH-2026-0098-T01',
      precio: 2600,
    });
  });
});
