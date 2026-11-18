import { TestBed } from '@angular/core/testing';

import { USUARIOS } from '../mocks/finca.mock';
import { SesionService } from './sesion.service';

describe('SesionService', () => {
  let servicio: SesionService;

  beforeEach(() => {
    servicio = TestBed.inject(SesionService);
  });

  it('arranca sin usuario hasta restaurar la sesión', () => {
    expect(servicio.usuario()).toBeNull();
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
