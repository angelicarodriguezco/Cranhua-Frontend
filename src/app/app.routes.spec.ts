import { TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { routes } from './app.routes';
import { GoogleMapsService } from './core/services/google-maps.service';

describe('Rutas del cafetalero', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
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
