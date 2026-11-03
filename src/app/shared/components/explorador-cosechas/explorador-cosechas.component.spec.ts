import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ExploradorCosechasComponent } from './explorador-cosechas.component';

describe('ExploradorCosechasComponent', () => {
  let fixture: ComponentFixture<ExploradorCosechasComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploradorCosechasComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ExploradorCosechasComponent);
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

  it('muestra al menos 6 cosechas sin filtros', () => {
    expect(fincasVisibles().length).toBeGreaterThanOrEqual(6);
    expect(chip('Todas').getAttribute('aria-pressed')).toBe('true');
  });

  it('solo ofrece las zonas que tienen cosechas', () => {
    const opciones = [...pagina.querySelectorAll('.chip-zona option')].map((o) => o.textContent);
    expect(opciones).toEqual([
      'Zona',
      'Tarrazú',
      'Valle Central',
      'Valle Occidental',
      'Orosi',
      'Turrialba',
      'Brunca',
    ]);
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
    expect(pagina.querySelector('.chip-zona')?.classList).toContain('activo');
  });

  it('avisa si ninguna cosecha cumple los filtros', () => {
    elegirZona('Orosi');
    clic(chip('Disponible ahora'));
    expect(fincasVisibles()).toEqual([]);
    expect(pagina.textContent).toContain('Ninguna cosecha coincide con los filtros.');
  });
});
