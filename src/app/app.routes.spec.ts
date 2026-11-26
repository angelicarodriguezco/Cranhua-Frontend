import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { routes } from './app.routes';
import { CAFETERIA_EJEMPLO } from './core/mocks/cafeteria.mock';
import { CUENTA_CAFETALERO_TOSTADOR, CUENTA_SOLO_CAFETALERO } from './core/mocks/cuenta.mock';
import { AuthService } from './core/services/auth.service';
import { CafeteriaService } from './core/services/cafeteria.service';
import { GoogleMapsService } from './core/services/google-maps.service';
import { conSesionDeEjemplo } from './core/testing/sesion-de-ejemplo';

describe('Rutas del cafetalero', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GoogleMapsService, useValue: { apiCargada: of(false) } },
      ],
    });
    conSesionDeEjemplo();
    harness = await RouterTestingHarness.create();
  });

  it('redirige las rutas cortas del cafetalero al prefijo /cafetalero', async () => {
    await harness.navigateByUrl('/fincas/f-la-esperanza');
    expect(TestBed.inject(Location).path()).toBe('/cafetalero/fincas/f-la-esperanza');

    await harness.navigateByUrl('/mis-fincas');
    expect(TestBed.inject(Location).path()).toBe('/cafetalero/fincas');

    await harness.navigateByUrl('/dashboard');
    expect(TestBed.inject(Location).path()).toBe('/cafetalero/dashboard');

    await harness.navigateByUrl('/historial');
    expect(TestBed.inject(Location).path()).toBe('/cafetalero/historial');

    await harness.navigateByUrl('/registrar-cosecha');
    expect(TestBed.inject(Location).path()).toBe('/cafetalero/registrar-cosecha');

    await harness.navigateByUrl('/mis-fincas/registrar');
    expect(TestBed.inject(Location).path()).toBe('/cafetalero/fincas/registrar');
  });
});

describe('Rutas de la cafetería', () => {
  let harness: RouterTestingHarness;
  let cafeteriaService: CafeteriaService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GoogleMapsService, useValue: { apiCargada: of(false) } },
      ],
    });
    cafeteriaService = TestBed.inject(CafeteriaService);
    conSesionDeEjemplo();
    harness = await RouterTestingHarness.create();
  });

  it('con cafetería registrada, el registro redirige al dashboard', async () => {
    spyOn(cafeteriaService, 'obtenerActual').and.returnValue(of(CAFETERIA_EJEMPLO));

    await harness.navigateByUrl('/cafeteria/registrar');
    expect(TestBed.inject(Location).path()).toBe('/cafeteria/dashboard');
  });

  it('sin cafetería, las vistas de cafetería redirigen al registro', async () => {
    spyOn(cafeteriaService, 'obtenerActual').and.returnValue(of(undefined));

    for (const ruta of ['/cafeteria/dashboard', '/cafeteria/pedidos', '/cafeteria/mi-cafeteria']) {
      await harness.navigateByUrl(ruta);
      expect(TestBed.inject(Location).path()).withContext(ruta).toBe('/cafeteria/registrar');
    }
  });
});

describe('Rutas privadas por sesión y rol', () => {
  let harness: RouterTestingHarness;
  let ruta: () => string;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GoogleMapsService, useValue: { apiCargada: of(false) } },
      ],
    });
    spyOn(TestBed.inject(CafeteriaService), 'obtenerActual').and.returnValue(of(CAFETERIA_EJEMPLO));
    ruta = () => TestBed.inject(Router).url;
    harness = await RouterTestingHarness.create();
  });

  it('sin sesión, los dashboards y sus vistas mandan al login con la ruta pedida', async () => {
    for (const privada of [
      '/perfil',
      '/onboarding-finca',
      '/cafetalero/dashboard',
      '/cafetalero/fincas/f-la-esperanza',
      '/tostador/dashboard',
      '/tostador/tostados/nuevo',
      '/cafeteria/registrar',
      '/cafeteria/dashboard',
      '/cafeteria/pedidos',
    ]) {
      await harness.navigateByUrl(privada);
      expect(ruta())
        .withContext(privada)
        .toBe(`/iniciar-sesion?volver=${encodeURIComponent(privada)}`);
    }
  });

  it('sin sesión, las rutas públicas abren', async () => {
    for (const publica of ['/', '/registro', '/iniciar-sesion', '/recuperar-contrasena']) {
      await harness.navigateByUrl(publica);
      expect(ruta()).withContext(publica).toBe(publica);
    }
  });

  it('con rol incorrecto lleva al dashboard del rol que tiene la cuenta', async () => {
    conSesionDeEjemplo(CUENTA_SOLO_CAFETALERO);

    for (const ajena of ['/tostador/negocio', '/cafeteria/pedidos', '/onboarding-tostador']) {
      await harness.navigateByUrl(ajena);
      expect(ruta()).withContext(ajena).toBe('/cafetalero/dashboard');
    }
  });

  it('una cuenta con varios roles abre las vistas de todos', async () => {
    conSesionDeEjemplo(CUENTA_CAFETALERO_TOSTADOR);

    for (const propia of ['/cafetalero/historial', '/tostador/solicitudes']) {
      await harness.navigateByUrl(propia);
      expect(ruta()).withContext(propia).toBe(propia);
    }
  });

  it('después de cerrar sesión las rutas privadas dejan de abrirse', async () => {
    conSesionDeEjemplo();
    await harness.navigateByUrl('/cafeteria/dashboard');
    expect(ruta()).toBe('/cafeteria/dashboard');

    TestBed.inject(AuthService).limpiarSesion();
    await harness.navigateByUrl('/cafeteria/pedidos');
    expect(ruta()).toBe('/iniciar-sesion?volver=%2Fcafeteria%2Fpedidos');
  });
});
