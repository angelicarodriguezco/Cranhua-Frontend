import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CAFETERIA_EJEMPLO } from '../../core/mocks/cafeteria.mock';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { DashboardCafeteriaComponent } from './dashboard-cafeteria.component';
import { dashboardApi, pedidoApi } from '../../core/testing/pedidos-cafeteria.fixture';
import { conSesionDeEjemplo } from '../../core/testing/sesion-de-ejemplo';

describe('DashboardCafeteriaComponent', () => {
  let fixture: ComponentFixture<DashboardCafeteriaComponent>;
  let pagina: HTMLElement;
  let http: HttpTestingController;
  const URL_DASHBOARD = `${environment.apiUrl}/api/cafeterias/${CAFETERIA_EJEMPLO.id}/dashboard`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCafeteriaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    spyOn(TestBed.inject(CafeteriaService), 'obtenerActual').and.returnValue(of(CAFETERIA_EJEMPLO));

    conSesionDeEjemplo();
    fixture = TestBed.createComponent(DashboardCafeteriaComponent);
    pagina = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(CLAVE_TEMA);
    http.verify();
  });

  function responder(cuerpo = DASHBOARD): void {
    http.expectOne(URL_DASHBOARD).flush(cuerpo);
    fixture.detectChanges();
  }

  const DASHBOARD = dashboardApi({
    pedidosRecientes: [
      pedidoApi({ id: 'r-1', cantidadKg: 20, estado: 'ENTREGADO' }),
      pedidoApi({ id: 'r-2', tostador: 'Café del Cerro', cantidadKg: 15, estado: 'ENTREGADO' }),
      pedidoApi({ id: 'r-3', cantidadKg: 10, estado: 'ENTREGADO' }),
      pedidoApi({ id: 'r-4', tostador: 'Grano y Fuego', cantidadKg: 8 }),
    ],
  });

  function rutasDe(enlaceSelector: string): string[] {
    return fixture.debugElement
      .queryAll(By.css(enlaceSelector))
      .map((el) => el.injector.get(RouterLink).href ?? '');
  }

  it('muestra un estado de carga mientras consulta', () => {
    expect(pagina.querySelector('[role="status"]')?.textContent).toContain('Cargando');
    responder();
    expect(pagina.querySelector('[role="status"]')).toBeNull();
  });

  it('muestra el título del dashboard', () => {
    responder();
    expect(pagina.querySelector('h1')?.textContent?.trim()).toBe('Dashboard');
    expect(pagina.textContent).toContain('Así va tu cafetería esta semana.');
  });

  it('muestra los 3 indicadores con labels del ticket y valores del backend', () => {
    responder();
    const indicadores = pagina.querySelector('.indicadores');
    expect(indicadores).toBeTruthy();

    const articulos = indicadores!.querySelectorAll('.tarjeta-enlace');
    expect(articulos).toHaveSize(3);

    expect(indicadores!.textContent).toContain('42 kg');
    expect(indicadores!.textContent).toContain('Café recibido');
    expect(indicadores!.textContent).toContain('5');
    expect(indicadores!.textContent).toContain('Pedidos activos');
    expect(indicadores!.textContent).toContain('3');
    expect(indicadores!.textContent).toContain('Tostadores activos');
  });

  it('muestra la tabla de pedidos con al menos 4 filas y ambos estados', () => {
    responder();
    const seccion = pagina.querySelector('.pedidos');
    expect(seccion).toBeTruthy();
    expect(seccion!.textContent).toContain('Pedidos recientes a tostadores');

    const filas = seccion!.querySelectorAll('tbody tr');
    expect(filas.length).toBeGreaterThanOrEqual(4);

    expect(seccion!.textContent).toContain('Tostaduría Volcán');
    expect(seccion!.textContent).toContain('Café del Cerro');
    expect(seccion!.textContent).toContain('Grano y Fuego');
    expect(seccion!.textContent).toContain('20 kg');
    expect(seccion!.textContent).toContain('15 kg');
    expect(seccion!.textContent).toContain('10 kg');
    expect(seccion!.textContent).toContain('8 kg');
    expect(seccion!.textContent).toContain('Entregado');
    expect(seccion!.textContent).toContain('En camino');

    expect(seccion!.querySelector('.pill-entregado')).toBeTruthy();
    expect(seccion!.querySelector('.pill-en-camino')).toBeTruthy();
  });

  it('los indicadores y los pedidos recientes abren su sección', () => {
    responder();
    expect(rutasDe('.indicadores a')).toEqual([
      '/cafeteria/pedidos',
      '/cafeteria/pedidos',
      '/cafeteria/tostadores',
    ]);
    const pedidos = rutasDe('.pedidos tbody a');
    expect(pedidos.length).toBeGreaterThanOrEqual(4);
    expect(new Set(pedidos)).toEqual(new Set(['/cafeteria/pedidos']));
  });

  it('enlaza el menú a los destinos de cafetería', () => {
    responder();
    expect(rutasDe('app-menu-lateral a')).toEqual(
      jasmine.arrayContaining([
        '/cafeteria/dashboard',
        '/cafeteria/tostadores',
        '/cafeteria/pedidos',
        '/cafeteria/mi-cafeteria',
        '/perfil',
        '/iniciar-sesion',
      ]),
    );
  });

  it('muestra el perfil del sidebar y sigue el tema global', () => {
    responder();
    const temas = TestBed.inject(TemaService);
    expect(pagina.querySelector('app-menu-lateral .perfil-rol')?.textContent).toContain(
      'Cafetería',
    );
    expect(pagina.querySelector('app-menu-lateral button')).toBeNull();
    expect(pagina.querySelector('.dashboard')?.getAttribute('data-theme')).toBe('claro');

    temas.alternarTema();
    fixture.detectChanges();

    expect(pagina.querySelector('.dashboard')?.getAttribute('data-theme')).toBe('oscuro');
  });

  it('muestra el estado vacío si todavía no hay pedidos', () => {
    responder(dashboardApi({ pedidosRecientes: [] }));
    expect(pagina.querySelector('.pedidos .vacio')?.textContent).toContain(
      'Todavía no hiciste pedidos',
    );
  });

  it('muestra el error y permite reintentar', () => {
    http
      .expectOne(URL_DASHBOARD)
      .flush({ mensaje: 'No tienes permiso.' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain('No tienes permiso.');

    pagina.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    responder();
    expect(pagina.querySelectorAll('.pedidos tbody tr')).toHaveSize(4);
  });
});
