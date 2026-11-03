import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterLink, provideRouter } from '@angular/router';

import { fechaIso } from '../../core/mocks/pedidos.mock';
import { Pedido } from '../../core/models/pedido.model';
import { calcularIndicadores } from '../../core/services/pedidos.service';
import { MisPedidosComponent } from './mis-pedidos.component';

describe('MisPedidosComponent', () => {
  let fixture: ComponentFixture<MisPedidosComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisPedidosComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MisPedidosComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

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

  function primeraEnCamino(): HTMLTableRowElement {
    return filas().find((f) => estado(f) === 'En camino')!;
  }

  function clic(fila: HTMLTableRowElement, etiqueta: string): void {
    [...fila.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent!.trim() === etiqueta)!
      .click();
    fixture.detectChanges();
  }

  it('muestra los 3 indicadores con los datos de ejemplo', () => {
    expect(indicadores()).toEqual([
      ['2', 'Pedidos activos'],
      ['15 kg', 'Kg recibidos este mes'],
      ['3', 'Tostadores activos'],
    ]);
  });

  it('muestra al menos un pedido de cada estado', () => {
    const estados = new Set(filas().map(estado));
    expect(estados).toEqual(new Set(['En camino', 'Entregado', 'Cancelado']));
  });

  it('solo los pedidos en camino tienen botones', () => {
    for (const fila of filas()) {
      const esperado = estado(fila) === 'En camino' ? ['Marcar recibido', 'Cancelar'] : [];
      expect(botones(fila)).toEqual(esperado);
    }
  });

  it('Marcar recibido pasa el pedido a entregado y suma sus kilos al mes', () => {
    const fila = primeraEnCamino();
    const tostador = fila.cells[0].textContent!.trim();

    clic(fila, 'Marcar recibido');

    const actualizada = filas().find((f) => f.cells[0].textContent!.trim() === tostador)!;
    expect(estado(actualizada)).toBe('Entregado');
    expect(botones(actualizada)).toEqual([]);
    expect(indicadores()[0][0]).toBe('1');
    expect(indicadores()[1][0]).toBe('27 kg');
  });

  it('Cancelar pasa el pedido a cancelado', () => {
    const fila = primeraEnCamino();

    clic(fila, 'Cancelar');

    expect(estado(fila)).toBe('Cancelado');
    expect(botones(fila)).toEqual([]);
    expect(indicadores()[0][0]).toBe('1');
  });

  it('Explorar tostadores lleva a la vista de tostadores de la cafetería', () => {
    const enlace = fixture.debugElement.query(By.css('.encabezado a')).injector.get(RouterLink);
    expect(enlace.href).toBe('/cafeteria/tostadores');
  });
});

describe('calcularIndicadores', () => {
  const hoy = new Date(2026, 10, 2);

  function pedido(datos: Partial<Pedido>): Pedido {
    return {
      id: 'p',
      tostador: 'Tostaduría Volcán',
      kilos: 10,
      fecha: '2026-10-20',
      estado: 'En camino',
      fechaRecibido: null,
      ...datos,
    };
  }

  it('cuenta los kilos por la fecha en que se recibieron, no la del pedido', () => {
    const indicadores = calcularIndicadores(
      [
        pedido({ estado: 'Entregado', fechaRecibido: fechaIso(hoy) }),
        pedido({ estado: 'Entregado', kilos: 4, fechaRecibido: '2026-10-31' }),
      ],
      hoy,
    );
    expect(indicadores.kgRecibidosMes).toBe(10);
  });

  it('no cuenta como activo a un tostador con solo pedidos cancelados', () => {
    const indicadores = calcularIndicadores(
      [
        pedido({ tostador: 'A' }),
        pedido({ tostador: 'A', estado: 'Entregado', fechaRecibido: '2026-10-25' }),
        pedido({ tostador: 'B', estado: 'Cancelado' }),
      ],
      hoy,
    );
    expect(indicadores.tostadoresActivos).toBe(1);
    expect(indicadores.activos).toBe(1);
  });
});
