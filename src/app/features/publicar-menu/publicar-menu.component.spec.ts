import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { formatearColones } from '../../shared/utils/formato';
import { PublicarMenuComponent } from './publicar-menu.component';

describe('PublicarMenuComponent', () => {
  let fixture: ComponentFixture<PublicarMenuComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicarMenuComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicarMenuComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  function filas(): string[][] {
    return [...pagina.querySelectorAll<HTMLTableRowElement>('tbody tr')].map((f) =>
      [...f.cells].slice(0, 4).map((c) => c.textContent!.trim()),
    );
  }

  function escribir(id: string, valor: string): void {
    const input = pagina.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  function clic(etiqueta: string): void {
    [...pagina.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent!.trim() === etiqueta)!
      .click();
    fixture.detectChanges();
  }

  it('muestra al menos 5 ítems de ejemplo, con cafés con código y comidas sin código', () => {
    const lista = filas();
    expect(lista.length).toBeGreaterThanOrEqual(5);
    expect(lista.some(([, cat, codigo]) => cat === 'Café' && codigo !== '—')).toBeTrue();
    expect(lista.some(([, cat, codigo]) => cat === 'Otra comida' && codigo === '—')).toBeTrue();
  });

  it('muestra los campos del formulario y una sola categoría elegida', () => {
    expect(pagina.querySelector('#item-nombre')).toBeTruthy();
    expect(pagina.querySelector('#item-codigo')).toBeTruthy();
    expect(pagina.querySelector('#item-precio')).toBeTruthy();
    const radios = [...pagina.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    expect(radios.length).toBe(2);
    expect(radios.filter((r) => r.checked).length).toBe(1);
  });

  it('no publica sin nombre ni precio y muestra los errores', () => {
    clic('Publicar ítem');
    expect(filas().length).toBe(5);
    const errores = [...pagina.querySelectorAll('.campo__error')].map((e) => e.textContent!.trim());
    expect(errores).toEqual(['Ingresá el nombre del ítem.', 'Ingresá el precio.']);
  });

  it('publica un ítem sin código y lo muestra con guion', () => {
    escribir('item-nombre', 'Tostada francesa');
    pagina.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1].click();
    escribir('item-precio', '2500');
    clic('Publicar ítem');

    expect(filas()[0]).toEqual(['Tostada francesa', 'Otra comida', '—', formatearColones(2500)]);
    expect(filas().length).toBe(6);
    expect(pagina.querySelector<HTMLInputElement>('#item-nombre')!.value).toBe('');
  });

  it('publica un café con su código de trazabilidad', () => {
    escribir('item-nombre', 'Latte');
    escribir('item-codigo', 'CRH-2026-0098-T01');
    escribir('item-precio', '2600');
    clic('Publicar ítem');

    expect(filas()[0].slice(0, 3)).toEqual(['Latte', 'Café', 'CRH-2026-0098-T01']);
  });

  it('Cancelar limpia el formulario', () => {
    escribir('item-nombre', 'Algo');
    clic('Cancelar');
    expect(pagina.querySelector<HTMLInputElement>('#item-nombre')!.value).toBe('');
  });

  it('Quitar elimina el ítem de la tabla', () => {
    const primero = filas()[0][0];
    pagina.querySelector<HTMLButtonElement>('tbody tr button')!.click();
    fixture.detectChanges();
    expect(filas().length).toBe(4);
    expect(filas().some(([nombre]) => nombre === primero)).toBeFalse();
  });
});
