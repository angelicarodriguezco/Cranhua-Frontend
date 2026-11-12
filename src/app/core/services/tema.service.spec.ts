import { TestBed } from '@angular/core/testing';

import { CLAVE_TEMA, TemaService } from './tema.service';

describe('TemaService', () => {
  function crear(): TemaService {
    TestBed.resetTestingModule();
    return TestBed.inject(TemaService);
  }

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  it('arranca en oscuro si no hay nada guardado', () => {
    localStorage.removeItem(CLAVE_TEMA);
    expect(crear().tema()).toBe('oscuro');
  });

  it('alterna y establece el tema y lo guarda en localStorage', () => {
    const servicio = crear();

    servicio.alternarTema();
    expect(servicio.tema()).toBe('claro');
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('claro');

    servicio.establecerTema('oscuro');
    expect(servicio.tema()).toBe('oscuro');
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('oscuro');
  });

  it('lee el tema guardado al crearse e ignora valores inválidos', () => {
    localStorage.setItem(CLAVE_TEMA, 'claro');
    expect(crear().tema()).toBe('claro');

    localStorage.setItem(CLAVE_TEMA, 'morado');
    expect(crear().tema()).toBe('oscuro');
  });

  it('no falla si localStorage tira error', () => {
    spyOn(localStorage, 'getItem').and.throwError('bloqueado');
    spyOn(localStorage, 'setItem').and.throwError('bloqueado');

    const servicio = crear();
    expect(servicio.tema()).toBe('oscuro');
    expect(() => servicio.alternarTema()).not.toThrow();
    expect(servicio.tema()).toBe('claro');
  });
});
