import { TestBed } from '@angular/core/testing';

import { USUARIO_ACTUAL, USUARIOS } from '../mocks/finca.mock';
import { SesionService } from './sesion.service';

describe('SesionService', () => {
  let servicio: SesionService;

  beforeEach(() => {
    servicio = TestBed.inject(SesionService);
  });

  it('arranca con el usuario de ejemplo', () => {
    expect(servicio.usuario()).toEqual(USUARIO_ACTUAL);
  });

  it('permite iniciar sesión con otro usuario', () => {
    servicio.iniciarSesion(USUARIOS[3]);
    expect(servicio.usuario()).toEqual(USUARIOS[3]);
  });

  it('limpia el usuario al cerrar sesión', () => {
    servicio.cerrarSesion();
    expect(servicio.usuario()).toBeNull();
  });
});
