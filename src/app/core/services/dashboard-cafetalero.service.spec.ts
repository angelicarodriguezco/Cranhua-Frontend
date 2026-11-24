import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import {
  DashboardCafetaleroResponseApi,
  SolicitudRecibidaApi,
} from '../models/dashboard-cafetalero.model';
import { DashboardCafetaleroService } from './dashboard-cafetalero.service';
import { CLAVE_TEMA } from './tema.service';

const BASE_DASHBOARD = `${environment.apiUrl}/api/cafetalero/dashboard`;
const BASE_SOLICITUDES = `${environment.apiUrl}/api/solicitudes`;

function solicitudApi(cambios: Partial<SolicitudRecibidaApi> = {}): SolicitudRecibidaApi {
  return {
    id: 's-1',
    cosechaId: 'c-1',
    nombreTostador: 'Tostaduría Volcán',
    variedad: 'Caturra',
    finca: 'La Catalina',
    cantidadKg: 40,
    solicitadaEn: '2026-11-19T15:00:00Z',
    estado: 'PENDIENTE',
    ...cambios,
  };
}

function resumenApi(
  cambios: Partial<DashboardCafetaleroResponseApi> = {},
): DashboardCafetaleroResponseApi {
  return {
    indicadores: {
      fincasRegistradas: 2,
      cosechasActivas: 3,
      kgDisponibles: 146,
      solicitudesPendientes: 2,
    },
    solicitudesRecientes: [
      solicitudApi(),
      solicitudApi({ id: 's-2', finca: 'Monte Alto', cantidadKg: 25 }),
    ],
    cosechasRecientes: [
      {
        id: 'cosecha-caturra-catalina',
        fincaId: 'finca-la-catalina',
        finca: 'La Catalina',
        variedad: 'Caturra',
        proceso: 'Honey',
        kgDisponibles: 96,
        estado: 'PUBLICADA',
      },
      {
        id: 'cosecha-geisha-monte-alto',
        fincaId: 'finca-monte-alto',
        finca: 'Monte Alto',
        variedad: 'Geisha',
        proceso: 'Lavado',
        kgDisponibles: 50,
        estado: 'PUBLICADA',
      },
      {
        id: 'cosecha-catuai-catalina',
        fincaId: 'finca-la-catalina',
        finca: 'La Catalina',
        variedad: 'Catuaí',
        proceso: 'Natural',
        kgDisponibles: null,
        estado: 'BORRADOR',
      },
    ],
    ...cambios,
  };
}

describe('DashboardCafetaleroService', () => {
  let servicio: DashboardCafetaleroService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(DashboardCafetaleroService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(CLAVE_TEMA);
  });

  function cargarResumen(cuerpo = resumenApi()): void {
    servicio.obtenerResumen().subscribe();
    const peticion = http.expectOne(BASE_DASHBOARD);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush(cuerpo);
  }

  it('obtiene el resumen del dashboard y mapea indicadores, solicitudes y cosechas', () => {
    cargarResumen();

    expect(servicio.indicadores()).toEqual({
      fincasRegistradas: 2,
      cosechasActivas: 3,
      kgDisponibles: 146,
      solicitudesPendientes: 2,
    });
    expect(servicio.solicitudesPendientes()).toHaveSize(2);
    expect(servicio.solicitudesPendientes()[0]).toEqual({
      id: 's-1',
      nombreTostador: 'Tostaduría Volcán',
      kgSolicitados: 40,
      variedad: 'Caturra',
      finca: 'La Catalina',
      cosechaId: 'c-1',
    });
    expect(servicio.cosechasRecientes()).toHaveSize(3);
    expect(servicio.cosechasRecientes()[0].estado).toBe('Publicada');
    expect(servicio.cosechasRecientes()[2]).toEqual(
      jasmine.objectContaining({
        variedad: 'Catuaí',
        kgDisponibles: null,
        estado: 'Borrador',
      }),
    );
  });

  it('usa solicitudesPendientes del indicador aunque la lista reciente sea más corta', () => {
    cargarResumen(
      resumenApi({
        indicadores: {
          fincasRegistradas: 2,
          cosechasActivas: 3,
          kgDisponibles: 146,
          solicitudesPendientes: 7,
        },
        solicitudesRecientes: [solicitudApi()],
      }),
    );

    expect(servicio.solicitudesPendientes()).toHaveSize(1);
    expect(servicio.indicadores()?.solicitudesPendientes).toBe(7);
  });

  it('aprueba una solicitud, la quita de pendientes y refresca el resumen', () => {
    cargarResumen();

    servicio.aprobarSolicitud('s-1').subscribe();
    const peticion = http.expectOne(`${BASE_SOLICITUDES}/s-1`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ estado: 'APROBADA' });
    peticion.flush({ id: 's-1', estado: 'APROBADA' });

    expect(servicio.solicitudesPendientes().map((s) => s.id)).toEqual(['s-2']);

    http.expectOne(BASE_DASHBOARD).flush(
      resumenApi({
        indicadores: {
          fincasRegistradas: 2,
          cosechasActivas: 3,
          kgDisponibles: 106,
          solicitudesPendientes: 1,
        },
        solicitudesRecientes: [solicitudApi({ id: 's-2', finca: 'Monte Alto', cantidadKg: 25 })],
      }),
    );

    expect(servicio.solicitudesPendientes().map((s) => s.id)).toEqual(['s-2']);
    expect(servicio.indicadores()?.solicitudesPendientes).toBe(1);
    expect(servicio.indicadores()?.kgDisponibles).toBe(106);
  });

  it('rechaza una solicitud y refresca el resumen', () => {
    cargarResumen();

    servicio.rechazarSolicitud('s-1').subscribe();
    const peticion = http.expectOne(`${BASE_SOLICITUDES}/s-1`);
    expect(peticion.request.body).toEqual({ estado: 'RECHAZADA' });
    peticion.flush({ id: 's-1', estado: 'RECHAZADA' });

    http.expectOne(BASE_DASHBOARD).flush(
      resumenApi({
        indicadores: {
          fincasRegistradas: 2,
          cosechasActivas: 3,
          kgDisponibles: 146,
          solicitudesPendientes: 1,
        },
        solicitudesRecientes: [solicitudApi({ id: 's-2' })],
      }),
    );

    expect(servicio.solicitudesPendientes().map((s) => s.id)).toEqual(['s-2']);
    expect(servicio.indicadores()?.solicitudesPendientes).toBe(1);
  });

  it('deja la solicitud pendiente si el API rechaza la aprobación', () => {
    cargarResumen();
    let fallo = false;

    servicio.aprobarSolicitud('s-1').subscribe({ error: () => (fallo = true) });
    http
      .expectOne(`${BASE_SOLICITUDES}/s-1`)
      .flush(
        { mensaje: 'No hay suficiente café disponible' },
        { status: 409, statusText: 'Conflict' },
      );

    expect(fallo).toBeTrue();
    expect(servicio.solicitudesPendientes()).toHaveSize(2);
  });

  it('alterna el tema entre claro y oscuro', () => {
    expect(servicio.tema()).toBe('claro');
    servicio.alternarTema();
    expect(servicio.tema()).toBe('oscuro');
    servicio.establecerTema('claro');
    expect(servicio.tema()).toBe('claro');
  });

  it('sincroniza y elimina cosechas recientes en memoria', () => {
    cargarResumen();

    servicio.sincronizarCosechaReciente({
      id: 'cosecha-nueva-test',
      variedad: 'Typica',
      finca: 'La Catalina',
      proceso: 'Natural',
      kgDisponibles: 30,
      estado: 'Publicada',
    });
    expect(servicio.cosechasRecientes()[0].id).toBe('cosecha-nueva-test');

    servicio.sincronizarCosechaReciente({
      id: 'cosecha-nueva-test',
      variedad: 'Typica',
      finca: 'La Catalina',
      proceso: 'Honey',
      kgDisponibles: 28,
      estado: 'Publicada',
    });
    expect(servicio.cosechasRecientes().find((c) => c.id === 'cosecha-nueva-test')?.proceso).toBe(
      'Honey',
    );

    servicio.eliminarCosechaReciente('cosecha-nueva-test');
    expect(servicio.cosechasRecientes().some((c) => c.id === 'cosecha-nueva-test')).toBeFalse();
  });
});
