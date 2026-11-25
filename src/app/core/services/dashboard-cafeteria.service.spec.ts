import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CAFETERIA_EJEMPLO } from '../mocks/cafeteria.mock';
import { ResumenDashboardCafeteria } from '../models/dashboard-cafeteria.model';
import { dashboardApi } from '../testing/pedidos-cafeteria.fixture';
import { CafeteriaService } from './cafeteria.service';
import { DashboardCafeteriaService } from './dashboard-cafeteria.service';

describe('DashboardCafeteriaService', () => {
  let servicio: DashboardCafeteriaService;
  let http: HttpTestingController;
  let cafeterias: CafeteriaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(DashboardCafeteriaService);
    http = TestBed.inject(HttpTestingController);
    cafeterias = TestBed.inject(CafeteriaService);
  });

  afterEach(() => http.verify());

  it('pide el dashboard de la cafetería de la cuenta y lo mapea', () => {
    spyOn(cafeterias, 'obtenerActual').and.returnValue(of(CAFETERIA_EJEMPLO));
    let resumen: ResumenDashboardCafeteria | undefined;
    servicio.obtenerResumen().subscribe((r) => (resumen = r));

    const req = http.expectOne(
      `${environment.apiUrl}/api/cafeterias/${CAFETERIA_EJEMPLO.id}/dashboard`,
    );
    expect(req.request.withCredentials).toBeTrue();
    req.flush(dashboardApi());

    expect(resumen?.indicadores).toEqual({
      cafeRecibidoKg: 42,
      pedidosActivos: 5,
      tostadoresActivos: 3,
    });
    expect(resumen?.pedidosRecientes[0]).toEqual({
      id: 'r-1',
      tostador: 'Tostaduría Volcán',
      kilos: 20,
      fecha: '2026-11-20',
      estado: 'Entregado',
    });
  });

  it('falla sin pedir nada si la cuenta no tiene cafetería', () => {
    spyOn(cafeterias, 'obtenerActual').and.returnValue(of(undefined));
    let fallo = false;
    servicio.obtenerResumen().subscribe({ error: () => (fallo = true) });

    expect(fallo).toBeTrue();
  });
});
