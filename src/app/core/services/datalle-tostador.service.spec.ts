import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { DetalleTostador } from '../models/detalle-tostador.model';
import { detalleTostadorApi } from '../testing/pedidos-cafeteria.fixture';
import { DetalleTostadorService } from './detalle-tostador.service';

describe('DetalleTostadorService', () => {
  let servicio: DetalleTostadorService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(DetalleTostadorService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('mapea el detalle y suma los kg de sus tuestes', () => {
    let detalle: DetalleTostador | undefined;
    servicio.obtener('t-volcan').subscribe((d) => (detalle = d));

    const req = http.expectOne(`${environment.apiUrl}/api/tostadores/t-volcan`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush(detalleTostadorApi());

    expect(detalle?.ubicacion).toBe('San José, San José');
    expect(detalle?.contacto).toEqual({
      nombre: 'Laura Mora',
      telefono: '+506 8888-1111',
      correo: 'laura@tostaduriavolcan.cr',
    });
    expect(detalle?.tuestes[1]).toEqual({
      id: 'tu-2',
      finca: 'Monte Alto',
      variedad: 'Geisha',
      nivel: 'Medio',
      kgDisponibles: 25,
    });
    expect(detalle?.kgDisponibles).toBe(97.5);
  });

  it('devuelve undefined si el tostador no existe', () => {
    let detalle: DetalleTostador | undefined | null = null;
    servicio.obtener('no-existe').subscribe((d) => (detalle = d));

    http
      .expectOne(`${environment.apiUrl}/api/tostadores/no-existe`)
      .flush({ mensaje: 'No encontramos ese negocio.' }, { status: 404, statusText: 'Not Found' });

    expect(detalle).toBeUndefined();
  });

  it('propaga los demás errores', () => {
    let fallo = false;
    servicio.obtener('t-volcan').subscribe({ error: () => (fallo = true) });

    http
      .expectOne(`${environment.apiUrl}/api/tostadores/t-volcan`)
      .flush(null, { status: 500, statusText: 'Error' });

    expect(fallo).toBeTrue();
  });
});
