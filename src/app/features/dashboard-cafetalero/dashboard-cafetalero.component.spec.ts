import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  DashboardCafetaleroResponseApi,
  SolicitudRecibidaApi,
} from '../../core/models/dashboard-cafetalero.model';
import { FincaResponseApi } from '../../core/models/finca.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { SesionService } from '../../core/services/sesion.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { USUARIOS } from '../../core/mocks/finca.mock';
import { DashboardCafetaleroComponent } from './dashboard-cafetalero.component';
import { conSesionDeEjemplo } from '../../core/testing/sesion-de-ejemplo';

const BASE_DASHBOARD = `${environment.apiUrl}/api/cafetalero/dashboard`;
const BASE_FINCAS = `${environment.apiUrl}/api/fincas`;
const BASE_SOLICITUDES = `${environment.apiUrl}/api/solicitudes`;

const PENDIENTES: SolicitudRecibidaApi[] = [
  {
    id: 's-volcan',
    cosechaId: 'c-caturra',
    nombreTostador: 'Tostaduría Volcán',
    variedad: 'Caturra',
    finca: 'La Catalina',
    cantidadKg: 40,
    solicitadaEn: '2026-11-19T15:00:00Z',
    estado: 'PENDIENTE',
  },
  {
    id: 's-altamira',
    cosechaId: 'c-geisha',
    nombreTostador: 'Café Altamira',
    variedad: 'Geisha',
    finca: 'Monte Alto',
    cantidadKg: 25,
    solicitadaEn: '2026-11-18T15:00:00Z',
    estado: 'PENDIENTE',
  },
];

const RESUMEN: DashboardCafetaleroResponseApi = {
  indicadores: {
    fincasRegistradas: 2,
    cosechasActivas: 3,
    kgDisponibles: 146,
    solicitudesPendientes: 2,
  },
  solicitudesRecientes: PENDIENTES,
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
};

const FINCAS_API: FincaResponseApi[] = [
  {
    id: 'finca-la-catalina',
    nombre: 'La Catalina',
    descripcion: null,
    zonaCafetalera: 'Tarrazú',
    perimetro: [],
    ubicacion: { lat: 9.6, lng: -84.0 },
    canton: 'Tarrazú',
    provincia: 'San José',
    areaHectareas: 12,
    duenos: [{ id: 'u-1', nombreCompleto: 'Rodrigo Alvarado' }],
    cosechasActivas: 2,
    kgDisponibles: 96,
  },
  {
    id: 'finca-monte-alto',
    nombre: 'Monte Alto',
    descripcion: null,
    zonaCafetalera: 'Tarrazú',
    perimetro: [],
    ubicacion: { lat: 9.5, lng: -83.9 },
    canton: 'Dota',
    provincia: 'San José',
    areaHectareas: 8,
    duenos: [{ id: 'u-1', nombreCompleto: 'Rodrigo Alvarado' }],
    cosechasActivas: 1,
    kgDisponibles: 50,
  },
];

describe('DashboardCafetaleroComponent', () => {
  let fixture: ComponentFixture<DashboardCafetaleroComponent>;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCafetaleroComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CafeteriaService, useValue: { obtenerActual: () => of(undefined) } },
      ],
    }).compileComponents();

    conSesionDeEjemplo();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DashboardCafetaleroComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(CLAVE_TEMA);
  });

  function responderResumen(cuerpo: DashboardCafetaleroResponseApi = RESUMEN): void {
    http.expectOne(BASE_DASHBOARD).flush(cuerpo);
    fixture.detectChanges();
  }

  function responderFincas(fincas: FincaResponseApi[] = FINCAS_API): void {
    http.expectOne(BASE_FINCAS).flush(fincas);
    fixture.detectChanges();
  }

  function cargarPagina(
    resumen: DashboardCafetaleroResponseApi = RESUMEN,
    fincas: FincaResponseApi[] = FINCAS_API,
  ): void {
    responderResumen(resumen);
    responderFincas(fincas);
  }

  function kpiPendientes(): string {
    return pagina.querySelector('.kpi-pendientes strong')!.textContent!.trim();
  }

  function boton(texto: string): HTMLButtonElement {
    const encontrado = [...pagina.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(texto),
    );
    if (!encontrado) {
      throw new Error(`No hay botón "${texto}"`);
    }
    return encontrado;
  }

  function rutasDe(enlaceSelector: string): string[] {
    return fixture.debugElement
      .queryAll(By.css(enlaceSelector))
      .map((el) => el.injector.get(RouterLink).href ?? '');
  }

  it('muestra guiones en KPIs mientras carga y luego los datos del resumen', () => {
    expect(pagina.querySelector('.indicadores')!.textContent).toContain('—');
    expect(pagina.querySelector('.solicitudes')!.textContent).toContain('Cargando solicitudes');

    cargarPagina();

    const seccion = pagina.querySelector('.solicitudes')!;
    expect(seccion.textContent).toContain('Tostaduría Volcán solicita 40 kg');
    expect(seccion.textContent).toContain('Cosecha Geisha · Finca Monte Alto');
    expect(seccion.textContent).toContain('2 pendientes');
    expect(kpiPendientes()).toBe('2');
  });

  it('avisa cuando no hay solicitudes pendientes', () => {
    cargarPagina({
      ...RESUMEN,
      indicadores: { ...RESUMEN.indicadores, solicitudesPendientes: 0 },
      solicitudesRecientes: [],
    });
    expect(pagina.querySelector('.solicitudes')!.textContent).toContain(
      'No hay solicitudes pendientes.',
    );
    expect(kpiPendientes()).toBe('0');
  });

  it('muestra un error de página si no se puede cargar el resumen', () => {
    http.expectOne(BASE_DASHBOARD).flush(null, { status: 500, statusText: 'Server Error' });
    responderFincas();
    fixture.detectChanges();

    expect(pagina.querySelector('.error-pagina')?.textContent).toContain(
      'No se pudo completar la solicitud',
    );
  });

  it('aprueba una solicitud, la quita de pendientes y actualiza el indicador', () => {
    cargarPagina();

    boton('Aprobar').click();
    fixture.detectChanges();
    const peticion = http.expectOne(`${BASE_SOLICITUDES}/s-volcan`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ estado: 'APROBADA' });
    expect(boton('Guardando').disabled).toBeTrue();

    peticion.flush({ id: 's-volcan', estado: 'APROBADA' });
    http.expectOne(BASE_DASHBOARD).flush({
      ...RESUMEN,
      indicadores: { ...RESUMEN.indicadores, solicitudesPendientes: 1, kgDisponibles: 106 },
      solicitudesRecientes: [PENDIENTES[1]],
    });
    fixture.detectChanges();

    const seccion = pagina.querySelector('.solicitudes')!;
    expect(seccion.textContent).not.toContain('Tostaduría Volcán');
    expect(seccion.textContent).toContain('1 pendientes');
    expect(kpiPendientes()).toBe('1');
  });

  it('rechaza una solicitud y la quita de pendientes', () => {
    cargarPagina();

    boton('Rechazar').click();
    const peticion = http.expectOne(`${BASE_SOLICITUDES}/s-volcan`);
    expect(peticion.request.body).toEqual({ estado: 'RECHAZADA' });
    peticion.flush({ id: 's-volcan', estado: 'RECHAZADA' });
    http.expectOne(BASE_DASHBOARD).flush({
      ...RESUMEN,
      indicadores: { ...RESUMEN.indicadores, solicitudesPendientes: 1 },
      solicitudesRecientes: [PENDIENTES[1]],
    });
    fixture.detectChanges();

    expect(pagina.querySelector('.solicitudes')!.textContent).not.toContain('Tostaduría Volcán');
    expect(kpiPendientes()).toBe('1');
  });

  it('muestra el mensaje del API si ya no hay cantidad suficiente', () => {
    cargarPagina();
    const mensaje = 'No hay suficiente café disponible: la solicitud pide 40 kg y quedan 10 kg.';

    boton('Aprobar').click();
    http
      .expectOne(`${BASE_SOLICITUDES}/s-volcan`)
      .flush({ mensaje }, { status: 409, statusText: 'Conflict' });
    http.expectOne(BASE_DASHBOARD).flush(RESUMEN);
    fixture.detectChanges();

    expect(pagina.querySelector('.error-solicitudes')?.textContent).toContain(mensaje);
    expect(pagina.querySelector('.solicitudes')!.textContent).toContain('Tostaduría Volcán');
    expect(kpiPendientes()).toBe('2');
    expect(boton('Aprobar').disabled).toBeFalse();
  });

  it('saluda con el nombre de la sesión sin emoji', () => {
    responderResumen();
    responderFincas();
    expect(pagina.textContent).toContain('Hola, Rodrigo');
    expect(pagina.textContent).not.toContain('👋');
  });

  it('usa el nombre de quien haya iniciado sesión', () => {
    TestBed.inject(SesionService).iniciarSesion(USUARIOS[3]);
    cargarPagina();
    expect(pagina.querySelector('h1')?.textContent?.trim()).toBe('Hola, Lucía');
  });

  it('muestra los 4 indicadores con datos del API', () => {
    cargarPagina();
    const indicadores = pagina.querySelector('.indicadores');
    expect(indicadores).toBeTruthy();

    const articulos = indicadores!.querySelectorAll('.tarjeta-enlace');
    expect(articulos).toHaveSize(4);
    expect(indicadores!.textContent).toContain('2');
    expect(indicadores!.textContent).toContain('Fincas registradas');
    expect(indicadores!.textContent).toContain('3');
    expect(indicadores!.textContent).toContain('Cosechas activas');
    expect(indicadores!.textContent).toContain('146 kg');
    expect(indicadores!.textContent).toContain('Disponible para tostadores');
    expect(indicadores!.textContent).toContain('Solicitudes pendientes');
  });

  it('carga mis fincas del API con ubicación, cosechas y Ver lotes trazables', () => {
    cargarPagina();
    const seccion = pagina.querySelector('.fincas');
    expect(seccion).toBeTruthy();
    expect(seccion!.textContent).toContain('Finca La Catalina');
    expect(seccion!.textContent).toContain('Tarrazú');
    expect(seccion!.textContent).toContain('Finca Monte Alto');
    expect(seccion!.textContent).toContain('Dota');
    expect(seccion!.textContent).toContain('2 cosechas');
    expect(seccion!.textContent).toContain('1 cosecha');
    expect(seccion!.querySelector('.nueva-finca')?.textContent).toContain('Registrar nueva finca');

    const lotes = [...pagina.querySelectorAll<HTMLAnchorElement>('.finca-acciones a')].find((a) =>
      a.textContent?.includes('Ver lotes trazables'),
    );
    expect(lotes?.getAttribute('href')).toBe(
      '/explorar?centrar=finca-la-catalina&resaltar=finca-la-catalina',
    );
  });

  it('muestra vacío de fincas cuando el API no devuelve ninguna', () => {
    responderResumen();
    responderFincas([]);
    expect(pagina.querySelector('.fincas')!.textContent).toContain(
      'Todavía no registraste fincas.',
    );
  });

  it('muestra error de sección si fallan las fincas', () => {
    responderResumen();
    http.expectOne(BASE_FINCAS).flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(pagina.querySelector('.fincas')!.textContent).toContain('No pudimos cargar tus fincas');
  });

  it('muestra la tabla de cosechas recientes del resumen', () => {
    cargarPagina();
    const seccion = pagina.querySelector('.cosechas');
    expect(seccion).toBeTruthy();

    const filas = seccion!.querySelectorAll('tbody tr');
    expect(filas.length).toBe(3);

    expect(seccion!.textContent).toContain('Caturra');
    expect(seccion!.textContent).toContain('Honey');
    expect(seccion!.textContent).toContain('96 kg');
    expect(seccion!.textContent).toContain('Geisha');
    expect(seccion!.textContent).toContain('Monte Alto');
    expect(seccion!.textContent).toContain('50 kg');
    expect(seccion!.textContent).toContain('Catuaí');
    expect(seccion!.textContent).toContain('Natural');
    expect(seccion!.textContent).toContain('—');
    expect(seccion!.textContent).toContain('Publicada');
    expect(seccion!.textContent).toContain('Borrador');
  });

  it('muestra vacío de cosechas cuando el resumen no trae ninguna', () => {
    cargarPagina({ ...RESUMEN, cosechasRecientes: [] });
    expect(pagina.querySelector('.cosechas')!.textContent).toContain('Todavía no hay cosechas.');
  });

  it('enlaza CTA, fincas, historial, explorar y menú a las rutas del plan', () => {
    cargarPagina();
    expect(rutasDe('.cta')).toEqual(['/cafetalero/registrar-cosecha']);
    expect(rutasDe('.fincas .seccion-cabecera a')).toEqual(['/cafetalero/fincas']);
    expect(rutasDe('.nueva-finca')).toEqual(['/cafetalero/fincas/registrar']);
    expect(rutasDe('.cosechas .seccion-cabecera a')).toEqual(['/cafetalero/historial']);

    expect(rutasDe('.indicadores a')).toEqual([
      '/cafetalero/fincas',
      '/cafetalero/historial',
      '/cafetalero/historial',
    ]);
    expect(rutasDe('.cosechas tbody a')).toContain(
      '/cafetalero/cosechas/cosecha-caturra-catalina/editar',
    );

    const detalles = rutasDe('.finca-acciones a');
    expect(detalles).toContain('/cafetalero/fincas/finca-la-catalina');
    expect(detalles).toContain('/cafetalero/fincas/finca-monte-alto');
    expect(detalles).toContain('/explorar?centrar=finca-la-catalina&resaltar=finca-la-catalina');
    expect(detalles).toContain('/explorar?centrar=finca-monte-alto&resaltar=finca-monte-alto');

    const nav = rutasDe('app-menu-lateral a');
    expect(nav).toEqual(
      jasmine.arrayContaining([
        '/cafetalero/dashboard',
        '/cafetalero/fincas',
        '/cafetalero/registrar-cosecha',
        '/cafetalero/historial',
        '/perfil',
        '/iniciar-sesion',
      ]),
    );
  });

  it('muestra el perfil del sidebar y sigue el tema global', () => {
    cargarPagina();
    expect(pagina.querySelector('app-menu-lateral .perfil')?.textContent).toContain(
      'Rodrigo Alvarado',
    );
    expect(pagina.querySelector('app-menu-lateral .avatar')?.textContent?.trim()).toBe('RA');
    expect(pagina.querySelector('app-menu-lateral button')).toBeNull();
    expect(pagina.querySelector('.dashboard')?.getAttribute('data-theme')).toBe('claro');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();

    expect(pagina.querySelector('.dashboard')?.getAttribute('data-theme')).toBe('oscuro');
  });
});
