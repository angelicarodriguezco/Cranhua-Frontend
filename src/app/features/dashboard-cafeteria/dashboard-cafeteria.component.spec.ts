import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import { of } from 'rxjs';

import { CAFETERIA_EJEMPLO } from '../../core/mocks/cafeteria.mock';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { DashboardCafeteriaComponent } from './dashboard-cafeteria.component';

describe('DashboardCafeteriaComponent', () => {
  let fixture: ComponentFixture<DashboardCafeteriaComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCafeteriaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    spyOn(TestBed.inject(CafeteriaService), 'obtenerActual').and.returnValue(of(CAFETERIA_EJEMPLO));

    fixture = TestBed.createComponent(DashboardCafeteriaComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  function rutasDe(enlaceSelector: string): string[] {
    return fixture.debugElement
      .queryAll(By.css(enlaceSelector))
      .map((el) => el.injector.get(RouterLink).href ?? '');
  }

  it('muestra el título del dashboard', () => {
    expect(pagina.querySelector('h1')?.textContent?.trim()).toBe('Dashboard');
    expect(pagina.textContent).toContain('Así va tu cafetería esta semana.');
  });

  it('muestra los 3 indicadores con labels del ticket y valores mock', () => {
    const indicadores = pagina.querySelector('.indicadores');
    expect(indicadores).toBeTruthy();

    const articulos = indicadores!.querySelectorAll('article');
    expect(articulos).toHaveSize(3);

    expect(indicadores!.textContent).toContain('42 kg');
    expect(indicadores!.textContent).toContain('Café recibido');
    expect(indicadores!.textContent).toContain('5');
    expect(indicadores!.textContent).toContain('Pedidos activos');
    expect(indicadores!.textContent).toContain('3');
    expect(indicadores!.textContent).toContain('Tostadores activos');
  });

  it('muestra la tabla de pedidos con al menos 4 filas y ambos estados', () => {
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

  it('enlaza el menú a los destinos de cafetería', () => {
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
    const temas = TestBed.inject(TemaService);
    expect(pagina.querySelector('app-menu-lateral .perfil-rol')?.textContent).toContain(
      'Cafetería',
    );
    expect(pagina.querySelector('app-menu-lateral button')).toBeNull();
    expect(pagina.querySelector('.dashboard')?.getAttribute('data-theme')).toBe('oscuro');

    temas.alternarTema();
    fixture.detectChanges();

    expect(pagina.querySelector('.dashboard')?.getAttribute('data-theme')).toBe('claro');

    temas.alternarTema();
    fixture.detectChanges();

    expect(pagina.querySelector('.dashboard')?.getAttribute('data-theme')).toBe('oscuro');
  });
});
