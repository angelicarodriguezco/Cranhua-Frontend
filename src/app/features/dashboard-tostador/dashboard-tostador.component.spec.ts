import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { DashboardTostadorComponent } from './dashboard-tostador.component';

describe('DashboardTostadorComponent', () => {
  let fixture: ComponentFixture<DashboardTostadorComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardTostadorComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardTostadorComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  function chip(texto: string): HTMLButtonElement {
    const encontrado = [...pagina.querySelectorAll<HTMLButtonElement>('.filtros button')].find(
      (b) => b.textContent?.trim() === texto,
    );
    if (!encontrado) {
      throw new Error(`No hay filtro "${texto}"`);
    }
    return encontrado;
  }

  function clic(elemento: HTMLElement): void {
    elemento.click();
    fixture.detectChanges();
  }

  function fincasVisibles(): string[] {
    return [...pagina.querySelectorAll('.tarjeta h3')].map((h) => h.textContent!.trim());
  }

  function rutasDe(selector: string): string[] {
    return fixture.debugElement
      .queryAll(By.css(selector))
      .map((el) => el.injector.get(RouterLink).href ?? '');
  }

  it('saluda al tostador', () => {
    expect(pagina.querySelector('h1')?.textContent?.trim()).toBe('Hola, Mariana');
  });

  it('muestra los 3 indicadores con datos de ejemplo', () => {
    const articulos = pagina.querySelectorAll('.indicadores article');
    expect(articulos).toHaveSize(3);

    const texto = pagina.querySelector('.indicadores')!.textContent!;
    expect(texto).toContain('Solicitudes activas');
    expect(texto).toContain('120 kg');
    expect(texto).toContain('Comprados este mes');
    expect(texto).toContain('Lotes con código');
    expect(texto).not.toContain('favoritas');
  });

  it('reutiliza el explorador de cosechas con sus filtros', () => {
    expect(pagina.querySelector('.cosechas app-explorador-cosechas')).not.toBeNull();
    expect(fincasVisibles().length).toBeGreaterThanOrEqual(6);
    expect(chip('Todas').getAttribute('aria-pressed')).toBe('true');

    clic(chip('Proceso honey'));
    expect(fincasVisibles()).toHaveSize(3);
  });

  it('"Ver detalle" lleva al detalle de cada cosecha', () => {
    expect(rutasDe('.tarjeta a')).toContain('/tostador/cosechas/cosecha-geisha-monte-alto');
    expect(rutasDe('.cosechas .seccion-cabecera a')).toEqual(['/tostador/cosechas']);
  });

  it('el menú lateral lleva a las secciones del tostador con Perfil y ajustes al final', () => {
    const enlaces = pagina.querySelectorAll('app-menu-lateral-tostador a');
    expect(enlaces[enlaces.length - 1].textContent?.trim()).toBe('Perfil y ajustes');

    expect(rutasDe('app-menu-lateral-tostador a')).toEqual([
      '/tostador/dashboard',
      '/tostador/cosechas',
      '/tostador/solicitudes',
      '/tostador/tostados',
      '/tostador/negocio',
      '/perfil',
    ]);
  });

  it('muestra el perfil del tostador y alterna entre tema oscuro y claro', () => {
    expect(pagina.querySelector('.perfil')?.textContent).toContain('Mariana Castro');
    expect(pagina.querySelector('.avatar')?.textContent?.trim()).toBe('MC');

    expect(pagina.querySelector('app-menu-lateral-tostador button')).toBeNull();
    const dashboard = pagina.querySelector('.dashboard')!;
    expect(dashboard.getAttribute('data-theme')).toBe('oscuro');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(dashboard.getAttribute('data-theme')).toBe('claro');
  });
});
