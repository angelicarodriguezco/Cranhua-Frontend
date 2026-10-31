import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { COSECHAS_DISPONIBLES } from '../../../core/mocks/cosechas-disponibles.mock';
import { CuadriculaCosechasComponent } from './cuadricula-cosechas.component';

describe('CuadriculaCosechasComponent', () => {
  let fixture: ComponentFixture<CuadriculaCosechasComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuadriculaCosechasComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CuadriculaCosechasComponent);
    pagina = fixture.nativeElement;
  });

  it('muestra finca, ubicación, variedad, proceso y precio desde por kg', () => {
    fixture.componentRef.setInput('cosechas', [COSECHAS_DISPONIBLES[1]]);
    fixture.detectChanges();

    const tarjeta = pagina.querySelector('.tarjeta')!;
    expect(tarjeta.querySelector('h3')?.textContent).toBe('Finca Monte Alto');
    expect(tarjeta.querySelector('.ubicacion')?.textContent).toBe('Copey, Dota');
    expect(tarjeta.querySelector('.datos')?.textContent).toContain('Geisha');
    expect(tarjeta.querySelector('.datos')?.textContent).toContain('Lavado');

    const precio = tarjeta.querySelector('.precio')!;
    expect(precio.textContent).toContain('Desde');
    expect(precio.querySelector('strong')?.textContent?.replace(/\s/g, ' ')).toBe('₡14 500');
    expect(precio.textContent).toContain('/ kg');
  });

  it('"Ver detalle" lleva al detalle de la cosecha', () => {
    fixture.componentRef.setInput('cosechas', COSECHAS_DISPONIBLES.slice(0, 2));
    fixture.detectChanges();

    const rutas = fixture.debugElement
      .queryAll(By.css('.tarjeta a'))
      .map((el) => el.injector.get(RouterLink).href);
    expect(rutas).toEqual([
      '/tostador/cosechas/cosecha-caturra-catalina',
      '/tostador/cosechas/cosecha-geisha-monte-alto',
    ]);
  });

  it('avisa cuando no hay cosechas', () => {
    fixture.componentRef.setInput('cosechas', []);
    fixture.detectChanges();

    expect(pagina.querySelector('.tarjeta')).toBeNull();
    expect(pagina.textContent).toContain('Ninguna cosecha coincide con los filtros.');
  });
});
