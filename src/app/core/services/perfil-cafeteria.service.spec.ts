import { TestBed } from '@angular/core/testing';

import { MENUS_PUBLICOS } from '../mocks/menu-publico.mock';
import { PERFILES_CAFETERIA } from '../mocks/perfil-cafeteria.mock';
import { PerfilCafeteriaService } from './perfil-cafeteria.service';

describe('PerfilCafeteriaService', () => {
  let servicio: PerfilCafeteriaService;

  beforeEach(() => {
    servicio = TestBed.inject(PerfilCafeteriaService);
  });

  it('devuelve el perfil por id', () => {
    expect(servicio.obtener('c-cafe-brumas')?.nombre).toBe('Café Brumas');
  });

  it('devuelve null si el id no existe', () => {
    expect(servicio.obtener('no-existe')).toBeNull();
  });

  it('cada cafetería del mock tiene al menos 2 fincas de origen', () => {
    for (const perfil of PERFILES_CAFETERIA) {
      expect(perfil.fincas.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('coincide con su menú público en cafés trazables y fincas de origen', () => {
    for (const perfil of PERFILES_CAFETERIA) {
      const menu = MENUS_PUBLICOS.find((m) => m.cafeteriaId === perfil.id);
      expect(menu).toBeDefined();

      expect(perfil.cafesTrazables).toBe(menu!.cafes.length);

      const fincasMenu = new Set(menu!.cafes.map((c) => c.fincaOrigen.id));
      expect(new Set(perfil.fincas.map((f) => f.id))).toEqual(fincasMenu);
    }
  });
});
