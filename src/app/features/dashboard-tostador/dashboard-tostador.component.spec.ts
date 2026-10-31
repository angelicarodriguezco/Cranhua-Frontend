import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

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

  function elegirZona(zona: string): void {
    const select = pagina.querySelector<HTMLSelectElement>('.chip-zona')!;
    select.value = zona;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
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

  it('muestra al menos 6 cosechas sin filtros', () => {
    expect(fincasVisibles().length).toBeGreaterThanOrEqual(6);
    expect(chip('Todas').getAttribute('aria-pressed')).toBe('true');
  });

  it('los filtros rápidos cambian las cosechas mostradas', () => {
    const todas = fincasVisibles().length;

    clic(chip('Proceso honey'));
    expect(fincasVisibles()).toEqual([
      'Finca La Catalina',
      'Finca Quebrada Honda',
      'Finca Cerro Verde',
    ]);
    expect(chip('Todas').getAttribute('aria-pressed')).toBe('false');

    clic(chip('Disponible ahora'));
    expect(fincasVisibles()).toEqual(['Finca La Catalina', 'Finca Cerro Verde']);

    clic(chip('Todas'));
    expect(fincasVisibles()).toHaveSize(todas);
  });

  it('filtra por notas florales y por zona', () => {
    clic(chip('Notas florales'));
    expect(fincasVisibles()).not.toContain('Finca Los Robles');

    clic(chip('Todas'));
    elegirZona('Turrialba');
    expect(fincasVisibles()).toEqual(['Finca Los Robles']);
  });

  it('avisa si ninguna cosecha cumple los filtros', () => {
    elegirZona('Orosi');
    clic(chip('Disponible ahora'));
    expect(fincasVisibles()).toEqual([]);
    expect(pagina.textContent).toContain('Ninguna cosecha coincide con los filtros.');
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

    const dashboard = pagina.querySelector('.dashboard')!;
    expect(dashboard.getAttribute('data-theme')).toBe('oscuro');

    clic(pagina.querySelector<HTMLButtonElement>('.toggle-tema')!);
    expect(dashboard.getAttribute('data-theme')).toBe('claro');
  });
});
