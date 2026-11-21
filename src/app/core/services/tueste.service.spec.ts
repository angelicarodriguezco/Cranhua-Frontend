import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import {
  ErrorTueste,
  FichaCodigoApi,
  LoteCompradoApi,
  LotesComprados,
  LotesCompradosResponseApi,
  NuevoTueste,
  TuesteApi,
} from '../models/tueste.model';
import { TuesteService, calcularMerma, kgPorTostar } from './tueste.service';

const BASE_LOTES = `${environment.apiUrl}/api/lotes`;
const BASE_TUESTES = `${environment.apiUrl}/api/tuestes`;

const LOTE_ACTIVO: LoteCompradoApi = {
  id: 'l-1',
  codigo: 'CRH-2026-0101',
  finca: 'La Catalina',
  variedad: 'Caturra',
  kg: 60,
  fechaCompra: '2026-10-06',
  estado: 'ACTIVO',
};

const LOTE_PENDIENTE: LoteCompradoApi = {
  id: 'l-2',
  codigo: 'CRH-2026-0102',
  finca: 'Los Robles',
  variedad: 'Catuai',
  kg: 40,
  fechaCompra: '2026-10-10',
  estado: 'PENDIENTE',
};

const TUESTE_API: TuesteApi = {
  id: 't-1',
  loteId: 'l-1',
  codigoLote: 'CRH-2026-0101',
  nivel: 'MEDIO',
  pesoVerdeKg: 12,
  pesoTostadoKg: 10.2,
  merma: 15,
  fechaTueste: '2026-10-21',
  notas: 'Primer crack',
};

describe('calcularMerma', () => {
  it('devuelve el porcentaje de peso perdido', () => {
    expect(calcularMerma(12, 10.2)).toBeCloseTo(15, 5);
    expect(calcularMerma(10, 10)).toBe(0);
  });

  it('devuelve null si los pesos no alcanzan para calcularla', () => {
    expect(calcularMerma(null, 5)).toBeNull();
    expect(calcularMerma(0, 0)).toBeNull();
    expect(calcularMerma(10, null)).toBeNull();
    expect(calcularMerma(5, 6)).toBeNull();
  });
});

describe('kgPorTostar', () => {
  it('resta la suma de peso verde de los tuestes del lote', () => {
    expect(kgPorTostar({ kg: 60 }, [{ pesoVerdeKg: 12 }, { pesoVerdeKg: 18 }])).toBe(30);
    expect(kgPorTostar({ kg: 40 }, [])).toBe(40);
  });
});

describe('TuesteService', () => {
  let servicio: TuesteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(TuesteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista lotes e indicadores desde GET /api/lotes', () => {
    const respuesta: LotesCompradosResponseApi = {
      indicadores: { lotesComprados: 2, kgComprados: 100, lotesConCodigo: 1 },
      lotes: [LOTE_ACTIVO, LOTE_PENDIENTE],
    };
    let resultado: LotesComprados | undefined;

    servicio.lotesComprados().subscribe((r) => (resultado = r));

    const req = http.expectOne(BASE_LOTES);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(respuesta);

    expect(resultado).toEqual({
      indicadores: { lotes: 2, kg: 100, conCodigo: 1 },
      lotes: [
        {
          id: 'l-1',
          codigoLote: 'CRH-2026-0101',
          finca: 'La Catalina',
          variedad: 'Caturra',
          proceso: null,
          kg: 60,
          fechaCompra: '2026-10-06',
          codigoTrazabilidad: 'CRH-2026-0101',
        },
        {
          id: 'l-2',
          codigoLote: 'CRH-2026-0102',
          finca: 'Los Robles',
          variedad: 'Catuai',
          proceso: null,
          kg: 40,
          fechaCompra: '2026-10-10',
          codigoTrazabilidad: null,
        },
      ],
    });
  });

  it('genera el código con POST /api/lotes/{id}/codigo', () => {
    const ficha: FichaCodigoApi = {
      id: 'l-2',
      codigo: 'CRH-2026-0102',
      finca: 'Los Robles',
      variedad: 'Catuai',
      kg: 40,
      tostador: 'Mario Brenes',
      estado: 'ACTIVO',
      activadoEn: '2026-11-01T12:00:00Z',
    };
    let codigo: string | null | undefined;
    let tostador: string | undefined;

    servicio.generarCodigo('l-2', { fechaCompra: '2026-10-10', proceso: null }).subscribe((r) => {
      codigo = r.lote.codigoTrazabilidad;
      tostador = r.tostador;
      expect(r.lote.fechaCompra).toBe('2026-10-10');
    });

    const req = http.expectOne(`${BASE_LOTES}/l-2/codigo`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(ficha);

    expect(codigo).toBe('CRH-2026-0102');
    expect(tostador).toBe('Mario Brenes');
  });

  it('lista tuestes del lote desde GET /api/lotes/{id}/tuestes', () => {
    let tuestesMapeados: unknown;

    servicio.tuestesDelLote('l-1').subscribe((tuestes) => (tuestesMapeados = tuestes));

    const req = http.expectOne(`${BASE_LOTES}/l-1/tuestes`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    req.flush([TUESTE_API]);

    expect(tuestesMapeados).toEqual([
      {
        id: 't-1',
        loteId: 'l-1',
        nivel: 'Medio',
        pesoVerdeKg: 12,
        pesoTostadoKg: 10.2,
        fecha: '2026-10-21',
        notas: 'Primer crack',
        codigoTrazabilidad: 'CRH-2026-0101',
      },
    ]);
  });

  it('obtener sin endpoint devuelve null', () => {
    let tueste: unknown = 'pendiente';
    servicio.obtener('t-1').subscribe((t) => (tueste = t));
    expect(tueste).toBeNull();
  });

  it('registra un tueste con POST /api/tuestes', () => {
    const nuevo: NuevoTueste = {
      loteId: 'l-1',
      nivel: 'Medio',
      pesoVerdeKg: 12,
      pesoTostadoKg: 10.2,
      fecha: '2026-10-21',
      notas: 'Primer crack',
    };
    let guardado: unknown;

    servicio.registrar(nuevo).subscribe((t) => (guardado = t));

    const req = http.expectOne(BASE_TUESTES);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual({
      loteId: 'l-1',
      nivel: 'MEDIO',
      pesoVerdeKg: 12,
      pesoTostadoKg: 10.2,
      fechaTueste: '2026-10-21',
      notas: 'Primer crack',
    });
    req.flush(TUESTE_API);

    expect(guardado).toEqual({
      id: 't-1',
      loteId: 'l-1',
      nivel: 'Medio',
      pesoVerdeKg: 12,
      pesoTostadoKg: 10.2,
      fecha: '2026-10-21',
      notas: 'Primer crack',
      codigoTrazabilidad: 'CRH-2026-0101',
    });
  });

  it('propaga errores de peso en 400 al registrar', () => {
    let error: ErrorTueste | undefined;

    servicio
      .registrar({
        loteId: 'l-1',
        nivel: 'Medio',
        pesoVerdeKg: 100,
        pesoTostadoKg: 10,
        fecha: '2026-10-21',
        notas: null,
      })
      .subscribe({ error: (e: ErrorTueste) => (error = e) });

    http.expectOne(BASE_TUESTES).flush(
      {
        mensaje: 'Revisá los pesos.',
        errores: {
          pesoVerdeKg: 'Supera el kg disponible del lote.',
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(error).toEqual({
      mensaje: 'Revisá los pesos.',
      errores: {
        pesoVerdeKg: 'Supera el kg disponible del lote.',
      },
    });
  });

  it('actualiza un tueste con PATCH /api/tuestes/{id}', () => {
    let peso: number | undefined;

    servicio
      .actualizar('t-1', {
        nivel: 'Oscuro',
        pesoVerdeKg: 15,
        pesoTostadoKg: 12,
        fecha: '2026-10-30',
        notas: null,
      })
      .subscribe((t) => (peso = t.pesoVerdeKg));

    const req = http.expectOne(`${BASE_TUESTES}/t-1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual({
      nivel: 'OSCURO',
      pesoVerdeKg: 15,
      pesoTostadoKg: 12,
      fechaTueste: '2026-10-30',
      notas: null,
    });
    req.flush({ ...TUESTE_API, nivel: 'OSCURO', pesoVerdeKg: 15, pesoTostadoKg: 12 });

    expect(peso).toBe(15);
  });

  it('propaga errores de peso en 400 al actualizar', () => {
    let error: ErrorTueste | undefined;

    servicio
      .actualizar('t-1', {
        nivel: 'Medio',
        pesoVerdeKg: 100,
        pesoTostadoKg: 10,
        fecha: '2026-10-21',
        notas: null,
      })
      .subscribe({ error: (e: ErrorTueste) => (error = e) });

    http.expectOne(`${BASE_TUESTES}/t-1`).flush(
      {
        mensaje: 'Revisá los pesos.',
        errores: {
          pesoVerdeKg: 'Supera el kg disponible del lote.',
          pesoTostadoKg: 'Debe ser menor que el peso verde.',
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(error).toEqual({
      mensaje: 'Revisá los pesos.',
      errores: {
        pesoVerdeKg: 'Supera el kg disponible del lote.',
        pesoTostadoKg: 'Debe ser menor que el peso verde.',
      },
    });
  });

  it('lotesConKgPorTostar filtra lotes sin kg restante', () => {
    let ids: string[] | undefined;

    servicio.lotesConKgPorTostar().subscribe((lotes) => (ids = lotes.map((l) => l.id)));

    http.expectOne(BASE_LOTES).flush({
      indicadores: { lotesComprados: 2, kgComprados: 100, lotesConCodigo: 1 },
      lotes: [LOTE_ACTIVO, LOTE_PENDIENTE],
    } satisfies LotesCompradosResponseApi);

    http.expectOne(`${BASE_LOTES}/l-1/tuestes`).flush([{ ...TUESTE_API, pesoVerdeKg: 60 }]);
    http.expectOne(`${BASE_LOTES}/l-2/tuestes`).flush([]);

    expect(ids).toEqual(['l-2']);
  });
});
