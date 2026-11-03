import { TestBed } from '@angular/core/testing';

import { ItemMenu } from '../models/menu-cafeteria.model';
import { MenuCafeteriaService } from './menu-cafeteria.service';

describe('MenuCafeteriaService', () => {
  let service: MenuCafeteriaService;

  beforeEach(() => {
    service = TestBed.inject(MenuCafeteriaService);
  });

  function items(): ItemMenu[] {
    let lista: ItemMenu[] = [];
    service.listar().subscribe((i) => (lista = i));
    return lista;
  }

  it('lista los 5 ítems de ejemplo', () => {
    expect(items().length).toBe(5);
  });

  it('publica un ítem nuevo al inicio con un id propio', () => {
    service
      .publicar({ nombre: 'Latte', categoria: 'Café', codigoTrazabilidad: null, precio: 2500 })
      .subscribe((item) => expect(item.id).toBe('menu-6'));
    expect(items()[0].nombre).toBe('Latte');
    expect(items().length).toBe(6);
  });

  it('quita un ítem por id', () => {
    service.quitar('menu-1').subscribe();
    expect(items().some((i) => i.id === 'menu-1')).toBeFalse();
  });
});
