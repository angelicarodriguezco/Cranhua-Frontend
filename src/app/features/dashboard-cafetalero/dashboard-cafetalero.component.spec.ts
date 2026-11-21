import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import { SolicitudRecibidaApi } from '../../core/models/dashboard-cafetalero.model';
import { SesionService } from '../../core/services/sesion.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { USUARIOS } from '../../core/mocks/finca.mock';
import { DashboardCafetaleroComponent } from './dashboard-cafetalero.component';
import { conSesionDeEjemplo } from '../../core/testing/sesion-de-ejemplo';

const BASE = `${environment.apiUrl}/api/solicitudes`;

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

describe('DashboardCafetaleroComponent', () => {
  let fixture: ComponentFixture<DashboardCafetaleroComponent>;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCafetaleroComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    conSesionDeEjemplo();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DashboardCafetaleroComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  function responderPendientes(solicitudes = PENDIENTES): void {
    http.expectOne((r) => r.url === `${BASE}/recibidas`).flush(solicitudes);
    fixture.detectChanges();
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

  it('carga las solicitudes pendientes reales al entrar', () => {
    expect(pagina.querySelector('.solicitudes')!.textContent).toContain('Cargando solicitudes');

    responderPendientes();

    const seccion = pagina.querySelector('.solicitudes')!;
    expect(seccion.textContent).toContain('Tostaduría Volcán solicita 40 kg');
    expect(seccion.textContent).toContain('Cosecha Geisha · Finca Monte Alto');
    expect(seccion.textContent).toContain('2 pendientes');
    expect(kpiPendientes()).toBe('2');
  });

  it('avisa cuando no hay solicitudes pendientes', () => {
    responderPendientes([]);
    expect(pagina.querySelector('.solicitudes')!.textContent).toContain(
      'No hay solicitudes pendientes.',
    );
    expect(kpiPendientes()).toBe('0');
  });

  it('muestra un error si no se pueden cargar las solicitudes', () => {
    http
      .expectOne((r) => r.url === `${BASE}/recibidas`)
      .flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(pagina.querySelector('.error-solicitudes')?.textContent).toContain(
      'No pudimos cargar las solicitudes',
    );
  });

  it('aprueba una solicitud, la quita de pendientes y actualiza el indicador', () => {
    responderPendientes();

    boton('Aprobar').click();
    fixture.detectChanges();
    const peticion = http.expectOne(`${BASE}/s-volcan`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual({ estado: 'APROBADA' });
    expect(boton('Guardando').disabled).toBeTrue();

    peticion.flush({ id: 's-volcan', estado: 'APROBADA' });
    fixture.detectChanges();

    const seccion = pagina.querySelector('.solicitudes')!;
    expect(seccion.textContent).not.toContain('Tostaduría Volcán');
    expect(seccion.textContent).toContain('1 pendientes');
    expect(kpiPendientes()).toBe('1');
  });

  it('rechaza una solicitud y la quita de pendientes', () => {
    responderPendientes();

    boton('Rechazar').click();
    const peticion = http.expectOne(`${BASE}/s-volcan`);
    expect(peticion.request.body).toEqual({ estado: 'RECHAZADA' });
    peticion.flush({ id: 's-volcan', estado: 'RECHAZADA' });
    fixture.detectChanges();

    expect(pagina.querySelector('.solicitudes')!.textContent).not.toContain('Tostaduría Volcán');
    expect(kpiPendientes()).toBe('1');
  });

  it('muestra el mensaje del API si ya no hay cantidad suficiente', () => {
    responderPendientes();
    const mensaje = 'No hay suficiente café disponible: la solicitud pide 40 kg y quedan 10 kg.';

    boton('Aprobar').click();
    http.expectOne(`${BASE}/s-volcan`).flush({ mensaje }, { status: 409, statusText: 'Conflict' });
    responderPendientes();

    expect(pagina.querySelector('.error-solicitudes')?.textContent).toContain(mensaje);
    expect(pagina.querySelector('.solicitudes')!.textContent).toContain('Tostaduría Volcán');
    expect(kpiPendientes()).toBe('2');
    expect(boton('Aprobar').disabled).toBeFalse();
  });

  it('saluda con el nombre de la sesión sin emoji', () => {
    expect(pagina.textContent).toContain('Hola, Rodrigo');
    expect(pagina.textContent).not.toContain('👋');
  });

  it('usa el nombre de quien haya iniciado sesión', () => {
    TestBed.inject(SesionService).iniciarSesion(USUARIOS[3]);
    fixture.detectChanges();
    expect(pagina.querySelector('h1')?.textContent?.trim()).toBe('Hola, Lucía');
  });

  it('muestra los 4 indicadores con datos de ejemplo', () => {
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

  it('muestra al menos 2 fincas y la opción de registrar una nueva', () => {
    const seccion = pagina.querySelector('.fincas');
    expect(seccion).toBeTruthy();
    expect(seccion!.textContent).toContain('Finca La Catalina');
    expect(seccion!.textContent).toContain('Tarrazú');
    expect(seccion!.textContent).toContain('Finca Monte Alto');
    expect(seccion!.textContent).toContain('Dota');
    expect(seccion!.textContent).toContain('2 cosechas');
    expect(seccion!.textContent).toContain('1 cosecha');
    expect(seccion!.querySelector('.nueva-finca')?.textContent).toContain('Registrar nueva finca');
  });

  it('muestra la tabla de cosechas recientes con al menos 3 filas', () => {
    const seccion = pagina.querySelector('.cosechas');
    expect(seccion).toBeTruthy();

    const filas = seccion!.querySelectorAll('tbody tr');
    expect(filas.length).toBeGreaterThanOrEqual(3);

    expect(seccion!.textContent).toContain('Caturra');
    expect(seccion!.textContent).toContain('Honey');
    expect(seccion!.textContent).toContain('96 kg');
    expect(seccion!.textContent).toContain('Geisha');
    expect(seccion!.textContent).toContain('Monte Alto');
    expect(seccion!.textContent).toContain('50 kg');
    expect(seccion!.textContent).toContain('Catuaí');
    expect(seccion!.textContent).toContain('Natural');
    expect(seccion!.textContent).toContain('—');
    expect(seccion!.textContent).toContain('Disponible');
    expect(seccion!.textContent).toContain('En beneficiado');
  });

  it('enlaza CTA, fincas, historial y menú a las rutas del plan', () => {
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

    const detalles = rutasDe('.fincas-grid article a');
    expect(detalles).toContain('/cafetalero/fincas/finca-la-catalina');
    expect(detalles).toContain('/cafetalero/fincas/finca-monte-alto');

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
