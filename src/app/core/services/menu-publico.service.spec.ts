import { TestBed } from '@angular/core/testing';

import { MenuPublicoService } from './menu-publico.service';

describe('MenuPublicoService', () => {
  let service: MenuPublicoService;

  beforeEach(() => {
    service = TestBed.inject(MenuPublicoService);
  });

  it('devuelve el menú de una cafetería existente', () => {
    const menu = service.obtener('c-cafe-brumas');
    expect(menu?.nombre).toBe('Café Brumas');
    expect(menu?.cafes.length).toBeGreaterThanOrEqual(3);
    expect(menu?.otrasComidas.length).toBeGreaterThanOrEqual(2);
  });

  it('devuelve null si la cafetería no existe', () => {
    expect(service.obtener('no-existe')).toBeNull();
  });
});
