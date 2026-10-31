import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { HistorialCafetaleroComponent } from './historial-cafetalero.component';

describe('HistorialCafetaleroComponent', () => {
  let fixture: ComponentFixture<HistorialCafetaleroComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialCafetaleroComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HistorialCafetaleroComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  function filas(selector: string): string[][] {
    return [...pagina.querySelectorAll(`${selector} tbody tr`)].map((fila) =>
      [...fila.querySelectorAll('td')].map((celda) => celda.textContent!.trim()),
    );
  }

  it('muestra los 3 indicadores con datos de ejemplo', () => {
    const articulos = [...pagina.querySelectorAll('.indicadores article')].map((a) => [
      a.querySelector('strong')!.textContent!.trim(),
      a.querySelector('span')!.textContent!.trim(),
    ]);

    expect(articulos).toEqual([
      ['7', 'Cosechas registradas'],
      ['675 kg', 'Producción total'],
      ['4', 'Lotes vendidos'],
    ]);
  });

  it('lista al menos 5 cosechas con fecha, variedad, kilos y estados distintos', () => {
    const cosechas = filas('.cosechas');

    expect(cosechas.length).toBeGreaterThanOrEqual(5);
    expect(cosechas[0]).toEqual(['1 dic 2025', 'Catuaí', '90 kg', 'En beneficiado']);

    const estados = new Set(cosechas.map((fila) => fila[3]));
    expect([...estados]).toEqual(
      jasmine.arrayWithExactContents(['Disponible', 'En beneficiado', 'En catación', 'Vendida']),
    );
  });

  it('cada estado de cosecha tiene su propio color', () => {
    const clases = new Set(
      [...pagina.querySelectorAll('.cosechas .pill')].map((pill) => pill.className),
    );
    expect(clases.size).toBe(4);
  });

  it('lista al menos 3 lotes vendidos con código de trazabilidad, comprador, kilos y precio', () => {
    const lotes = filas('.lotes');

    expect(lotes.length).toBeGreaterThanOrEqual(3);
    for (const [codigo, comprador, kilos, precio] of lotes) {
      expect(codigo).toMatch(/^CRN-[A-Z]{2}-\d{4}-\d{2}$/);
      expect(comprador).toBeTruthy();
      expect(kilos).toMatch(/kg$/);
      expect(precio).toContain('₡');
    }
    expect(lotes[0].slice(0, 3)).toEqual(['CRN-LC-2506-02', 'Café Altamira', '50 kg']);
  });

  it('"Nueva cosecha" lleva al formulario de registro de cosecha', () => {
    const cta = fixture.debugElement.query(By.css('.cta'));

    expect(cta.nativeElement.textContent).toContain('Nueva cosecha');
    expect(cta.injector.get(RouterLink).href).toBe('/registrar-cosecha');
  });

  it('comparte el tema del panel y permite cambiarlo a claro', () => {
    const contenedor = () => pagina.querySelector('.historial')?.getAttribute('data-theme');
    expect(contenedor()).toBe('oscuro');

    const toggle = [...pagina.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Tema claro'),
    )!;
    toggle.click();
    fixture.detectChanges();

    expect(contenedor()).toBe('claro');
    expect(TestBed.inject(DashboardCafetaleroService).tema()).toBe('claro');
  });
});
