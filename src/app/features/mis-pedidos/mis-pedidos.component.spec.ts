import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterLink, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CAFETERIA_EJEMPLO } from '../../core/mocks/cafeteria.mock';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { historialApi, pedidoApi } from '../../core/testing/pedidos-cafeteria.fixture';
import { MisPedidosComponent } from './mis-pedidos.component';

const BASE = `${environment.apiUrl}/api/pedidos`;

describe('MisPedidosComponent', () => {
  let fixture: ComponentFixture<MisPedidosComponent>;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MisPedidosComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    // El menú lateral consulta la cafetería de la cuenta
    spyOn(TestBed.inject(CafeteriaService), 'obtenerActual').and.returnValue(of(CAFETERIA_EJEMPLO));
    fixture = TestBed.createComponent(MisPedidosComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function responderListado(cuerpo = historialApi()): void {
    http.expectOne({ url: BASE, method: 'GET' }).flush(cuerpo);
    fixture.detectChanges();
  }

  function indicadores(): string[][] {
    return [...pagina.querySelectorAll('.indicadores article')].map((a) => [
      a.querySelector('strong')!.textContent!.trim(),
      a.querySelector('span')!.textContent!.trim(),
    ]);
  }

  function filas(): HTMLTableRowElement[] {
    return [...pagina.querySelectorAll<HTMLTableRowElement>('tbody tr')];
  }

  function estado(fila: HTMLTableRowElement): string {
    return fila.cells[3].textContent!.trim();
  }

  function botones(fila: HTMLTableRowElement): string[] {
    return [...fila.querySelectorAll('button')].map((b) => b.textContent!.trim());
  }

  function enCamino(): HTMLTableRowElement {
    return filas().find((f) => estado(f) === 'En camino')!;
  }

  function clic(fila: HTMLTableRowElement, etiqueta: string): void {
    [...fila.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent!.trim() === etiqueta)!
      .click();
    fixture.detectChanges();
  }

  it('muestra el estado de carga mientras consulta', () => {
    expect(pagina.querySelector('[role="status"]')?.textContent).toContain('Cargando pedidos');
    responderListado();
    expect(pagina.querySelector('[role="status"]')).toBeNull();
  });

  it('muestra los indicadores que calcula el backend', () => {
    responderListado();
    expect(indicadores()).toEqual([
      ['1', 'Pedidos activos'],
      ['15 kg', 'Kg recibidos este mes'],
      ['2', 'Tostadores activos'],
    ]);
  });

  it('lista los pedidos reales y solo los en camino tienen botones', () => {
    responderListado();
    expect(new Set(filas().map(estado))).toEqual(new Set(['En camino', 'Entregado', 'Cancelado']));
    for (const fila of filas()) {
      const esperado = estado(fila) === 'En camino' ? ['Marcar recibido', 'Cancelar'] : [];
      expect(botones(fila)).toEqual(esperado);
    }
  });

  it('Marcar recibido cambia el estado real y refresca los indicadores', () => {
    responderListado();
    clic(enCamino(), 'Marcar recibido');

    const patch = http.expectOne(`${BASE}/p-1`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ estado: 'ENTREGADO' });
    patch.flush(pedidoApi({ estado: 'ENTREGADO' }));
    fixture.detectChanges();

    const fila = filas().find((f) => f.cells[0].textContent!.trim() === 'Tostaduría Volcán')!;
    expect(estado(fila)).toBe('Entregado');
    expect(botones(fila)).toEqual([]);

    const actualizado = historialApi({
      indicadores: { pedidosActivos: 0, kgRecibidosEsteMes: 27, tostadoresActivos: 2 },
    });
    actualizado.pedidos[0] = pedidoApi({ estado: 'ENTREGADO' });
    responderListado(actualizado);

    expect(indicadores()[0][0]).toBe('0');
    expect(indicadores()[1][0]).toBe('27 kg');
  });

  it('Cancelar cambia el estado real a cancelado', () => {
    responderListado();
    clic(enCamino(), 'Cancelar');

    const patch = http.expectOne(`${BASE}/p-1`);
    expect(patch.request.body).toEqual({ estado: 'CANCELADO' });
    patch.flush(pedidoApi({ estado: 'CANCELADO' }));
    fixture.detectChanges();

    expect(filas().filter((f) => estado(f) === 'Cancelado')).toHaveSize(2);
    responderListado();
  });

  it('si el backend rechaza el cambio muestra el mensaje y deja la fila igual', () => {
    responderListado();
    clic(enCamino(), 'Cancelar');

    http
      .expectOne(`${BASE}/p-1`)
      .flush({ mensaje: 'El pedido ya fue cerrado.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(pagina.querySelector('.aviso-error')?.textContent).toContain(
      'El pedido ya fue cerrado.',
    );
    expect(estado(enCamino())).toBe('En camino');
  });

  it('muestra el estado vacío cuando no hay pedidos', () => {
    responderListado(
      historialApi({
        indicadores: { pedidosActivos: 0, kgRecibidosEsteMes: 0, tostadoresActivos: 0 },
        pedidos: [],
      }),
    );
    expect(pagina.querySelector('.vacio')?.textContent).toContain('Todavía no hiciste pedidos');
  });

  it('muestra el error de carga y permite reintentar', () => {
    http
      .expectOne(BASE)
      .flush({ mensaje: 'No pudimos cargar tus pedidos.' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain(
      'No pudimos cargar tus pedidos.',
    );
    pagina.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    fixture.detectChanges();
    responderListado();
    expect(filas()).toHaveSize(3);
  });

  it('Explorar tostadores lleva a la vista de tostadores de la cafetería', () => {
    responderListado();
    const enlace = fixture.debugElement.query(By.css('.encabezado a')).injector.get(RouterLink);
    expect(enlace.href).toBe('/cafeteria/tostadores');
  });
});
