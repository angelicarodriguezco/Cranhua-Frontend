import { TestBed } from '@angular/core/testing';

import { CLAVE_ONBOARDING_ROLES, OnboardingRolesService } from './onboarding-roles.service';

describe('OnboardingRolesService', () => {
  function crear(): OnboardingRolesService {
    TestBed.resetTestingModule();
    return TestBed.inject(OnboardingRolesService);
  }

  afterEach(() => sessionStorage.removeItem(CLAVE_ONBOARDING_ROLES));

  it('ordena al iniciar según el catálogo y deja pendientes sin el actual', () => {
    const servicio = crear();

    servicio.iniciar(['cafeteria', 'cafetalero', 'tostador']);

    expect(servicio.progreso()).toEqual({ actual: 1, total: 3 });
    expect(servicio.hayCadena()).toBeTrue();
    expect(servicio.siguienteRuta()).toBe('/onboarding-tostador');
    expect(JSON.parse(sessionStorage.getItem(CLAVE_ONBOARDING_ROLES)!)).toEqual({
      rolesSeleccionados: ['cafetalero', 'tostador', 'cafeteria'],
      rolesPendientes: ['tostador', 'cafeteria'],
    });
  });

  it('con un solo rol no hay cadena y el destino es el dashboard', () => {
    const servicio = crear();

    servicio.iniciar(['tostador']);

    expect(servicio.hayCadena()).toBeFalse();
    expect(servicio.progreso()).toEqual({ actual: 1, total: 1 });
    expect(servicio.siguienteRuta()).toBeNull();
    expect(servicio.destinoTrasCompletar('tostador')).toBe('/tostador/dashboard');
  });

  it('destinoTrasCompletar apunta al siguiente onboarding o al dashboard', () => {
    const servicio = crear();
    servicio.iniciar(['cafetalero', 'cafeteria']);

    expect(servicio.destinoTrasCompletar('cafetalero')).toBe('/onboarding-cafeteria');

    servicio.completarRolActual();
    expect(servicio.progreso()).toEqual({ actual: 2, total: 2 });
    expect(servicio.destinoTrasCompletar('cafeteria')).toBe('/cafeteria/dashboard');
  });

  it('completarRolActual avanza la cola y limpia al terminar el último', () => {
    const servicio = crear();
    servicio.iniciar(['cafetalero', 'tostador', 'cafeteria']);

    servicio.completarRolActual();
    expect(servicio.siguienteRuta()).toBe('/onboarding-cafeteria');
    expect(servicio.progreso()).toEqual({ actual: 2, total: 3 });

    servicio.completarRolActual();
    expect(servicio.siguienteRuta()).toBeNull();
    expect(servicio.progreso()).toEqual({ actual: 3, total: 3 });
    expect(servicio.hayCadena()).toBeTrue();

    servicio.completarRolActual();
    expect(servicio.hayCadena()).toBeFalse();
    expect(servicio.progreso()).toEqual({ actual: 0, total: 0 });
    expect(sessionStorage.getItem(CLAVE_ONBOARDING_ROLES)).toBeNull();
  });

  it('hidrata desde sessionStorage al crearse', () => {
    sessionStorage.setItem(
      CLAVE_ONBOARDING_ROLES,
      JSON.stringify({
        rolesSeleccionados: ['cafetalero', 'tostador'],
        rolesPendientes: ['tostador'],
      }),
    );

    const servicio = crear();

    expect(servicio.hayCadena()).toBeTrue();
    expect(servicio.progreso()).toEqual({ actual: 1, total: 2 });
    expect(servicio.siguienteRuta()).toBe('/onboarding-tostador');
  });

  it('limpiar vacía memoria y sessionStorage', () => {
    const servicio = crear();
    servicio.iniciar(['cafetalero', 'cafeteria']);

    servicio.limpiar();

    expect(servicio.hayCadena()).toBeFalse();
    expect(servicio.progreso()).toEqual({ actual: 0, total: 0 });
    expect(servicio.siguienteRuta()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_ONBOARDING_ROLES)).toBeNull();
  });

  it('ignora estado inválido en sessionStorage', () => {
    sessionStorage.setItem(CLAVE_ONBOARDING_ROLES, '{no-json');
    expect(crear().hayCadena()).toBeFalse();

    sessionStorage.setItem(
      CLAVE_ONBOARDING_ROLES,
      JSON.stringify({ rolesSeleccionados: ['invalido'], rolesPendientes: [] }),
    );
    expect(crear().hayCadena()).toBeFalse();
  });

  it('no falla si sessionStorage tira error', () => {
    const getItem = spyOn(sessionStorage, 'getItem').and.throwError('bloqueado');
    const setItem = spyOn(sessionStorage, 'setItem').and.throwError('bloqueado');
    const removeItem = spyOn(sessionStorage, 'removeItem').and.throwError('bloqueado');

    const servicio = crear();
    expect(servicio.hayCadena()).toBeFalse();
    expect(() => servicio.iniciar(['cafeteria', 'cafetalero'])).not.toThrow();
    expect(servicio.hayCadena()).toBeTrue();
    expect(() => servicio.limpiar()).not.toThrow();

    getItem.and.callThrough();
    setItem.and.callThrough();
    removeItem.and.callThrough();
  });
});
