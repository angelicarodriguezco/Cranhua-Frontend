import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { ExplorarCosechasComponent } from './explorar-cosechas.component';

describe('ExplorarCosechasComponent', () => {
  let fixture: ComponentFixture<ExplorarCosechasComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExplorarCosechasComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ExplorarCosechasComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  function clic(elemento: HTMLElement): void {
    elemento.click();
    fixture.detectChanges();
  }

  it('muestra el título y al menos 6 cosechas de distintas fincas', () => {
    expect(pagina.querySelector('h1')?.textContent?.trim()).toBe('Explorar cosechas');

    const fincas = [...pagina.querySelectorAll('.tarjeta h3')].map((h) => h.textContent);
    expect(fincas.length).toBeGreaterThanOrEqual(6);
    expect(new Set(fincas).size).toBe(fincas.length);
  });

  it('ofrece los filtros rápidos y cambian las cosechas mostradas', () => {
    const chips = [...pagina.querySelectorAll<HTMLButtonElement>('.filtros button')];
    expect(chips.map((b) => b.textContent?.trim())).toEqual([
      'Todas',
      'Disponible ahora',
      'Notas florales',
      'Proceso honey',
    ]);
    expect(pagina.querySelector('.filtros select')?.getAttribute('aria-label')).toBe('Zona');

    const todas = pagina.querySelectorAll('.tarjeta').length;
    clic(chips[3]);
    expect(pagina.querySelectorAll('.tarjeta').length).toBeLessThan(todas);
  });

  it('"Ver detalle" lleva al detalle y solicitud de cada cosecha', () => {
    const rutas = fixture.debugElement
      .queryAll(By.css('.tarjeta a'))
      .map((el) => el.injector.get(RouterLink).href);
    expect(rutas).toContain('/tostador/cosechas/cosecha-caturra-catalina');
    expect(rutas.every((ruta) => ruta?.startsWith('/tostador/cosechas/cosecha-'))).toBeTrue();
  });

  it('comparte el tema con el resto del tostador y arranca en oscuro', () => {
    const vista = pagina.querySelector('.dashboard')!;
    expect(vista.getAttribute('data-theme')).toBe('oscuro');

    clic(pagina.querySelector<HTMLButtonElement>('.toggle-tema')!);
    expect(vista.getAttribute('data-theme')).toBe('claro');
    expect(TestBed.inject(DashboardTostadorService).tema()).toBe('claro');
  });
});
