import { TestBed } from '@angular/core/testing';

import { CUENTA_ACTUAL, CUENTA_SOLO_CAFETALERO } from '../mocks/cuenta.mock';
import { CuentaService } from './cuenta.service';

describe('CuentaService', () => {
  let servicio: CuentaService;

  beforeEach(() => {
    servicio = TestBed.inject(CuentaService);
  });

  it('arranca con la cuenta de ejemplo', () => {
    expect(servicio.cuenta()).toEqual(CUENTA_ACTUAL);
  });

  it('permite cambiar la cuenta actual', () => {
    servicio.establecerCuenta(CUENTA_SOLO_CAFETALERO);
    expect(servicio.cuenta()?.roles).toEqual(['cafetalero']);
  });

  it('limpia la cuenta actual', () => {
    servicio.limpiarCuenta();
    expect(servicio.cuenta()).toBeNull();
  });
});
