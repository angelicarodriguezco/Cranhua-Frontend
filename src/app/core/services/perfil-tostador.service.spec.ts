import { TestBed } from '@angular/core/testing';

import { PERFILES_TOSTADOR } from '../mocks/perfil-tostador.mock';
import { PerfilTostadorService } from './perfil-tostador.service';

describe('PerfilTostadorService', () => {
  let servicio: PerfilTostadorService;

  beforeEach(() => {
    servicio = TestBed.inject(PerfilTostadorService);
  });

  it('devuelve el perfil por id', () => {
    expect(servicio.obtener('n-tostaduria-volcan')?.nombre).toBe('Tostaduría Volcán');
  });

  it('devuelve null si el id no existe', () => {
    expect(servicio.obtener('no-existe')).toBeNull();
  });

  it('cada tostador del mock tiene al menos 2 fincas y 1 punto de venta', () => {
    for (const perfil of PERFILES_TOSTADOR) {
      expect(perfil.fincas.length).toBeGreaterThanOrEqual(2);
      expect(perfil.puntosVenta.length).toBeGreaterThanOrEqual(1);
    }
  });
});
