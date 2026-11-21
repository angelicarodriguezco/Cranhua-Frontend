import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { SolicitudRecibidaApi } from '../models/dashboard-cafetalero.model';
import { DashboardCafetaleroService } from './dashboard-cafetalero.service';
import { CLAVE_TEMA } from './tema.service';

const BASE = `${environment.apiUrl}/api/solicitudes`;

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

  function cargar(solicitudes: SolicitudRecibidaApi[]): void {
    servicio.cargarSolicitudesPendientes().subscribe();
    const peticion = http.expectOne((r) => r.url === `${BASE}/recibidas`);
    expect(peticion.request.params.get('estado')).toBe('PENDIENTE');
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush(solicitudes);
  }

  it('expone los indicadores del prototipo unificado', () => {
    const indicadores = servicio.indicadores();
    expect(indicadores.fincasRegistradas).toBe(2);
    expect(indicadores.cosechasActivas).toBe(3);
    expect(indicadores.kgDisponibles).toBe(146);
    expect(indicadores.solicitudesPendientes).toBe(0);
  });

  it('carga las solicitudes pendientes del API y las cuenta en el indicador', () => {
    cargar([solicitudApi(), solicitudApi({ id: 's-2', finca: 'Monte Alto', cantidadKg: 25 })]);

    const pendientes = servicio.solicitudesPendientes();
    expect(pendientes).toHaveSize(2);
    expect(pendientes[0]).toEqual({
      id: 's-1',
      nombreTostador: 'Tostaduría Volcán',
      kgSolicitados: 40,
      variedad: 'Caturra',
      finca: 'La Catalina',
      cosechaId: 'c-1',
    });
    expect(pendientes[1].finca).toBe('Monte Alto');
    expect(servicio.indicadores().solicitudesPendientes).toBe(2);
  });

  it('aprueba una solicitud y la quita de pendientes', () => {
    cargar([solicitudApi(), solicitudApi({ id: 's-2' })]);

    servicio.aprobarSolicitud('s-1').subscribe();
    const peticion = http.expectOne(`${BASE}/s-1`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ estado: 'APROBADA' });
    peticion.flush({ id: 's-1', estado: 'APROBADA' });

    expect(servicio.solicitudesPendientes().map((s) => s.id)).toEqual(['s-2']);
    expect(servicio.indicadores().solicitudesPendientes).toBe(1);
  });

  it('rechaza una solicitud y la quita de pendientes', () => {
    cargar([solicitudApi()]);

    servicio.rechazarSolicitud('s-1').subscribe();
    const peticion = http.expectOne(`${BASE}/s-1`);
    expect(peticion.request.body).toEqual({ estado: 'RECHAZADA' });
    peticion.flush({ id: 's-1', estado: 'RECHAZADA' });

    expect(servicio.solicitudesPendientes()).toEqual([]);
    expect(servicio.indicadores().solicitudesPendientes).toBe(0);
  });

  it('deja la solicitud pendiente si el API rechaza la aprobación', () => {
    cargar([solicitudApi()]);
    let fallo = false;

    servicio.aprobarSolicitud('s-1').subscribe({ error: () => (fallo = true) });
    http
      .expectOne(`${BASE}/s-1`)
      .flush(
        { mensaje: 'No hay suficiente café disponible' },
        { status: 409, statusText: 'Conflict' },
      );

    expect(fallo).toBeTrue();
    expect(servicio.solicitudesPendientes()).toHaveSize(1);
  });

  it('alterna el tema entre claro y oscuro', () => {
    expect(servicio.tema()).toBe('claro');
    servicio.alternarTema();
    expect(servicio.tema()).toBe('oscuro');
    servicio.establecerTema('claro');
    expect(servicio.tema()).toBe('claro');
  });

  it('sincroniza y elimina cosechas recientes en memoria', () => {
    servicio.sincronizarCosechaReciente({
      id: 'cosecha-nueva-test',
      variedad: 'Typica',
      finca: 'La Catalina',
      proceso: 'Natural',
      kgDisponibles: 30,
      estado: 'Disponible',
    });
    expect(servicio.cosechasRecientes()[0].id).toBe('cosecha-nueva-test');
    expect(servicio.indicadores().cosechasActivas).toBe(4);

    servicio.sincronizarCosechaReciente({
      id: 'cosecha-nueva-test',
      variedad: 'Typica',
      finca: 'La Catalina',
      proceso: 'Honey',
      kgDisponibles: 28,
      estado: 'Disponible',
    });
    expect(servicio.cosechasRecientes().find((c) => c.id === 'cosecha-nueva-test')?.proceso).toBe(
      'Honey',
    );

    servicio.eliminarCosechaReciente('cosecha-nueva-test');
    expect(servicio.cosechasRecientes().some((c) => c.id === 'cosecha-nueva-test')).toBeFalse();
    expect(servicio.indicadores().cosechasActivas).toBe(3);
  });
});
