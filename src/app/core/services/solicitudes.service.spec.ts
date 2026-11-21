import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ErrorSolicitud, SolicitudesEnviadas } from '../models/solicitud.model';
import { SolicitudesService, calcularIndicadores } from './solicitudes.service';

const BASE = `${environment.apiUrl}/api/solicitudes`;
const ENVIADAS = `${BASE}/enviadas`;

describe('calcularIndicadores', () => {
  it('cuenta pendientes, del mes y fincas distintas', () => {
    const hoy = new Date('2026-11-20T12:00:00');
    const indicadores = calcularIndicadores(
      [
        {
          id: '1',
          cosechaId: 'c-1',
          finca: 'A',
          lote: 'L1',
          kilos: 10,
          fecha: '2026-11-15',
          estado: 'Pendiente',
        },
        {
          id: '2',
          cosechaId: 'c-2',
          finca: 'A',
          lote: 'L2',
          kilos: 5,
          fecha: '2026-10-01',
          estado: 'Aprobada',
        },
        {
          id: '3',
          cosechaId: 'c-3',
          finca: 'B',
          lote: 'L3',
          kilos: 8,
          fecha: '2026-11-01',
          estado: 'Pendiente',
        },
      ],
      hoy,
    );

    expect(indicadores).toEqual({
      pendientes: 2,
      esteMes: 2,
      fincasContactadas: 2,
    });
  });
});

describe('SolicitudesService', () => {
  let servicio: SolicitudesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(SolicitudesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista enviadas con credentials y mapea indicadores y estados', () => {
    let resultado: SolicitudesEnviadas | undefined;
    servicio.listar().subscribe((data) => (resultado = data));

    const peticion = http.expectOne(ENVIADAS);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush({
      indicadores: { pendientes: 1, esteMes: 2, fincasContactadas: 1 },
      solicitudes: [
        {
          id: 's-2',
          cosechaId: 'c-2',
          fincaId: 'f-1',
          finca: 'Monte Alto',
          variedad: 'Caturra',
          codigoLote: null,
          cantidadKg: 20,
          solicitadaEn: '2026-11-10T12:00:00.000Z',
          estado: 'APROBADA',
        },
        {
          id: 's-1',
          cosechaId: 'c-1',
          fincaId: 'f-1',
          finca: 'Monte Alto',
          variedad: 'Geisha',
          codigoLote: 'LC-1',
          cantidadKg: 40,
          solicitadaEn: '2026-11-20T15:00:00.000Z',
          estado: 'PENDIENTE',
        },
      ],
    });

    expect(resultado?.indicadores).toEqual({
      pendientes: 1,
      esteMes: 2,
      fincasContactadas: 1,
    });
    expect(resultado?.solicitudes.map((s) => s.id)).toEqual(['s-1', 's-2']);
    expect(resultado?.solicitudes[0]).toEqual(
      jasmine.objectContaining({
        id: 's-1',
        lote: 'LC-1',
        kilos: 40,
        estado: 'Pendiente',
      }),
    );
    expect(resultado?.solicitudes[1]).toEqual(
      jasmine.objectContaining({
        id: 's-2',
        lote: 'Caturra',
        estado: 'Aprobada',
      }),
    );
  });

  it('crea con body cantidadKg, credentials y mapea la respuesta', () => {
    let resultado: unknown;
    servicio
      .crear({ cosechaId: 'c-1', kilos: 45.5, precioKg: 5800 })
      .subscribe((s) => (resultado = s));

    const peticion = http.expectOne(BASE);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.withCredentials).toBeTrue();
    expect(peticion.request.body).toEqual({ cosechaId: 'c-1', cantidadKg: 45.5 });
    peticion.flush({
      id: 's-1',
      cosechaId: 'c-1',
      cantidadKg: 45.5,
      precioKg: 5800,
      totalEstimado: 263900,
      estado: 'PENDIENTE',
      solicitadaEn: '2026-11-20T15:00:00.000Z',
      respondidaEn: null,
      codigoLote: 'LC-1',
    });

    expect(resultado).toEqual(
      jasmine.objectContaining({
        id: 's-1',
        cosechaId: 'c-1',
        lote: 'LC-1',
        kilos: 45.5,
        estado: 'Pendiente',
      }),
    );
  });

  it('en 400 de stock propaga mensaje y errores.cantidadKg', () => {
    let error: ErrorSolicitud | undefined;
    servicio.crear({ cosechaId: 'c-1', kilos: 999, precioKg: 5800 }).subscribe({
      error: (e: ErrorSolicitud) => (error = e),
    });

    http.expectOne(BASE).flush(
      {
        mensaje: 'No hay suficiente café disponible: pedís 999 kg',
        errores: { cantidadKg: 'Excede el disponible' },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(error).toEqual({
      mensaje: 'No hay suficiente café disponible: pedís 999 kg',
      errores: { cantidadKg: 'Excede el disponible' },
    });
  });
});
