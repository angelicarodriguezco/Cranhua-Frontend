import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { HistorialCafetaleroResponseApi } from '../../core/models/historial-cafetalero.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { HistorialCafetaleroComponent } from './historial-cafetalero.component';

const BASE_HISTORIAL = `${environment.apiUrl}/api/cafetalero/historial`;

function paginaApi<T>(contenido: T[]) {
  return {
    contenido,
    pagina: 0,
    tamano: 50,
    totalElementos: contenido.length,
    totalPaginas: 1,
  };
}

const HISTORIAL: HistorialCafetaleroResponseApi = {
  indicadores: {
    cosechasRegistradas: 3,
    produccionTotalKg: 280,
    lotesVendidos: 2,
  },
  cosechas: paginaApi([
    {
      id: 'cosecha-catuai-catalina',
      fincaId: 'finca-la-catalina',
      finca: 'La Catalina',
      variedad: 'Catuaí',
      fechaInicio: '2025-12-01',
      fechaFin: '2025-12-10',
      cantidadCosechadaKg: 90,
      estado: 'BORRADOR',
    },
    {
      id: 'cosecha-caturra-catalina',
      fincaId: 'finca-la-catalina',
      finca: 'La Catalina',
      variedad: 'Caturra',
      fechaInicio: '2025-11-01',
      fechaFin: '2025-11-15',
      cantidadCosechadaKg: 120,
      estado: 'PUBLICADA',
    },
    {
      id: 'cosecha-geisha-monte-alto',
      fincaId: 'finca-monte-alto',
      finca: 'Monte Alto',
      variedad: 'Geisha',
      fechaInicio: '2025-10-20',
      fechaFin: '2025-11-05',
      cantidadCosechadaKg: 70,
      estado: 'AGOTADA',
    },
  ]),
  lotesVendidos: paginaApi([
    {
      id: 'lote-1',
      codigo: 'CRN-LC-2511-01',
      cosechaId: 'cosecha-caturra-catalina',
      fincaId: 'finca-la-catalina',
      finca: 'La Catalina',
      variedad: 'Caturra',
      comprador: 'Café Altamira',
      kg: 50,
      precioKg: 4200,
      total: 210000,
      vendidoEn: '2025-11-20',
    },
    {
      id: 'lote-2',
      codigo: 'CRN-MA-2510-02',
      cosechaId: 'cosecha-geisha-monte-alto',
      fincaId: 'finca-monte-alto',
      finca: 'Monte Alto',
      variedad: 'Geisha',
      comprador: 'Tostaduría Volcán',
      kg: 30,
      precioKg: 8500,
      total: 255000,
      vendidoEn: '2025-10-28',
    },
  ]),
};

describe('HistorialCafetaleroComponent', () => {
  let fixture: ComponentFixture<HistorialCafetaleroComponent>;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialCafetaleroComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CafeteriaService, useValue: { obtenerActual: () => of(undefined) } },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HistorialCafetaleroComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(CLAVE_TEMA);
  });

  function flushHistorial(cuerpo: HistorialCafetaleroResponseApi = HISTORIAL): void {
    const peticion = http.expectOne(
      (req) => req.url === BASE_HISTORIAL && req.params.get('tamano') === '50',
    );
    peticion.flush(cuerpo);
    fixture.detectChanges();
  }

  function filas(selector: string): string[][] {
    return [...pagina.querySelectorAll(`${selector} tbody tr`)].map((fila) =>
      [...fila.querySelectorAll('td')].map((celda) => celda.textContent!.trim()),
    );
  }

  it('muestra guiones en KPIs mientras carga', () => {
    const valores = [...pagina.querySelectorAll('.indicadores strong')].map((el) =>
      el.textContent!.trim(),
    );
    expect(valores).toEqual(['—', '—', '—']);
    flushHistorial();
  });

  it('muestra los 3 indicadores del API', () => {
    flushHistorial();

    const articulos = [...pagina.querySelectorAll('.indicadores article')].map((a) => [
      a.querySelector('strong')!.textContent!.trim(),
      a.querySelector('span')!.textContent!.trim(),
    ]);

    expect(articulos).toEqual([
      ['3', 'Cosechas registradas'],
      ['280 kg', 'Producción total'],
      ['2', 'Lotes vendidos'],
    ]);
  });

  it('lista cosechas con fecha, finca, variedad, kilos y estados del API', () => {
    flushHistorial();
    const cosechas = filas('.cosechas');

    expect(cosechas).toHaveSize(3);
    expect(cosechas[0]).toEqual([
      '1 dic 2025',
      'La Catalina',
      'Catuaí',
      '90 kg',
      'Borrador',
      'Editar →',
    ]);

    const estados = new Set(cosechas.map((fila) => fila[4]));
    expect([...estados]).toEqual(
      jasmine.arrayWithExactContents(['Borrador', 'Publicada', 'Agotada']),
    );
  });

  it('cada estado de cosecha tiene su propio color', () => {
    flushHistorial();
    const clases = new Set(
      [...pagina.querySelectorAll('.cosechas .pill')].map((pill) =>
        [...pill.classList].filter((c) => c.startsWith('pill-')).sort().join(' '),
      ),
    );
    expect(clases.size).toBe(3);
  });

  it('lista lotes vendidos con código, comprador, kilos y precio total', () => {
    flushHistorial();
    const lotes = filas('.lotes');

    expect(lotes).toHaveSize(2);
    for (const [codigo, comprador, kilos, precio] of lotes) {
      expect(codigo).toMatch(/^CRN-[A-Z]{2}-\d{4}-\d{2}$/);
      expect(comprador).toBeTruthy();
      expect(kilos).toMatch(/kg$/);
      expect(precio).toContain('₡');
    }
    expect(lotes[0].slice(0, 3)).toEqual(['CRN-LC-2511-01', 'Café Altamira', '50 kg']);
  });

  it('muestra vacío cuando no hay cosechas ni lotes', () => {
    flushHistorial({
      indicadores: { cosechasRegistradas: 0, produccionTotalKg: 0, lotesVendidos: 0 },
      cosechas: paginaApi([]),
      lotesVendidos: paginaApi([]),
    });

    expect(filas('.cosechas')[0][0]).toContain('Todavía no registraste cosechas');
    expect(filas('.lotes')[0][0]).toContain('Todavía no vendiste lotes');
  });

  it('muestra error y permite reintentar', () => {
    const fallida = http.expectOne(
      (req) => req.url === BASE_HISTORIAL && req.params.get('tamano') === '50',
    );
    fallida.flush({ mensaje: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(pagina.querySelector('.error-pagina')?.textContent).toContain('No autorizado');

    pagina.querySelector<HTMLButtonElement>('.error-pagina button')!.click();
    fixture.detectChanges();

    flushHistorial();
    expect(pagina.querySelector('.error-pagina')).toBeNull();
    expect(filas('.cosechas')).toHaveSize(3);
  });

  it('"Nueva cosecha" lleva al formulario de registro de cosecha', () => {
    flushHistorial();
    const cta = fixture.debugElement.query(By.css('.cta'));

    expect(cta.nativeElement.textContent).toContain('Nueva cosecha');
    expect(cta.injector.get(RouterLink).href).toBe('/cafetalero/registrar-cosecha');
  });

  it('cada fila de cosecha abre su edición', () => {
    flushHistorial();
    const rutas = fixture.debugElement
      .queryAll(By.css('.cosechas tbody tr.fila-enlace a'))
      .map((el) => el.injector.get(RouterLink).href);

    expect(rutas.length).toBe(filas('.cosechas').length);
    expect(rutas[0]).toBe('/cafetalero/cosechas/cosecha-catuai-catalina/editar');
  });

  it('comparte el tema global con el panel', () => {
    flushHistorial();
    const contenedor = () => pagina.querySelector('.historial')?.getAttribute('data-theme');
    expect(contenedor()).toBe('claro');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();

    expect(contenedor()).toBe('oscuro');
    expect(TestBed.inject(DashboardCafetaleroService).tema()).toBe('oscuro');
  });
});
