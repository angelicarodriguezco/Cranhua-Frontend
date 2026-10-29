import { TestBed } from '@angular/core/testing';

import { CafeteriaService } from './cafeteria.service';

describe('CafeteriaService', () => {
  let servicio: CafeteriaService;

  beforeEach(() => {
    servicio = TestBed.inject(CafeteriaService);
  });

  it('ubica una cafetería en Chepe centro', () => {
    expect(servicio.cantonDe({ lat: 9.9335, lng: -84.0775 })?.nombre).toBe('San José');
  });

  it('no asigna cantón a un punto lejos de todos', () => {
    expect(servicio.cantonDe({ lat: 11.2, lng: -85.6 })).toBeNull();
  });
});
