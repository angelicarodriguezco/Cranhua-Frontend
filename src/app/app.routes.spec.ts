import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { routes } from './app.routes';
import { CAFETERIA_EJEMPLO } from './core/mocks/cafeteria.mock';
import { CafeteriaService } from './core/services/cafeteria.service';
import { GoogleMapsService } from './core/services/google-maps.service';

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
