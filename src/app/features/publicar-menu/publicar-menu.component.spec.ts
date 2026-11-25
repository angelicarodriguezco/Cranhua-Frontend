import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { ItemMenu } from '../../core/models/menu-cafeteria.model';
import { MenuCafeteriaService } from '../../core/services/menu-cafeteria.service';
import { formatearColones } from '../../shared/utils/formato';
import { PublicarMenuComponent } from './publicar-menu.component';

const ITEMS_INICIALES: ItemMenu[] = [
  {
    id: 'menu-1',
    nombre: 'Espresso Tarrazú',
    categoria: 'Café',
    codigoTrazabilidad: 'CRH-2026-0101-T01',
    precio: 1800,
  },
  {
    id: 'menu-2',
    nombre: 'Queque de naranja',
    categoria: 'Otra comida',
    codigoTrazabilidad: null,
    precio: 1500,
  },
];

describe('PublicarMenuComponent', () => {
  let fixture: ComponentFixture<PublicarMenuComponent>;
  let pagina: HTMLElement;
  let menuService: jasmine.SpyObj<MenuCafeteriaService>;

  beforeEach(async () => {
    menuService = jasmine.createSpyObj('MenuCafeteriaService', ['listar', 'publicar', 'quitar']);
    menuService.listar.and.returnValue(of(ITEMS_INICIALES));
    menuService.publicar.and.callFake((nuevo) =>
      of({
        id: 'menu-nuevo',
        ...nuevo,
      }),
    );
    menuService.quitar.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [PublicarMenuComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: MenuCafeteriaService, useValue: menuService },
      ],
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

  function crearConListar(listar$: ReturnType<MenuCafeteriaService['listar']>): void {
    menuService.listar.and.returnValue(listar$);
    fixture = TestBed.createComponent(PublicarMenuComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  }

  it('muestra loading y luego la lista del servicio', () => {
    const listar$ = new Subject<ItemMenu[]>();
    crearConListar(listar$.asObservable());

    expect(menuService.listar).toHaveBeenCalled();
    expect(pagina.querySelector('[role="status"]')?.textContent).toContain('Cargando menú…');
    expect(pagina.querySelector('tbody')).toBeNull();

    listar$.next(ITEMS_INICIALES);
    listar$.complete();
    fixture.detectChanges();

    expect(pagina.querySelector('[role="status"]')).toBeNull();
    expect(filas()).toEqual([
      ['Espresso Tarrazú', 'Café', 'CRH-2026-0101-T01', formatearColones(1800)],
      ['Queque de naranja', 'Otra comida', '—', formatearColones(1500)],
    ]);
  });

  it('muestra vacío cuando el menú no tiene ítems', () => {
    crearConListar(of([]));

    expect(pagina.querySelector('.vacio')?.textContent).toContain(
      'Todavía no tenés ítems en el menú.',
    );
  });

  it('muestra error de carga y permite reintentar', () => {
    crearConListar(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            statusText: 'Error',
            error: { mensaje: 'No se pudo cargar el menú.' },
          }),
      ),
    );

    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo cargar el menú.',
    );

    menuService.listar.and.returnValue(of(ITEMS_INICIALES));
    clic('Reintentar');
    expect(filas().length).toBe(2);
  });

  it('deshabilita el submit mientras publica', () => {
    const publicar$ = new Subject<ItemMenu>();
    menuService.publicar.and.returnValue(publicar$.asObservable());

    escribir('item-nombre', 'Latte');
    escribir('item-precio', '2600');
    clic('Publicar ítem');

    const submit = [...pagina.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      b.textContent!.includes('Publicando'),
    )!;
    expect(submit.disabled).toBeTrue();
    expect(submit.textContent).toContain('Publicando…');

    publicar$.next({
      id: 'menu-nuevo',
      nombre: 'Latte',
      categoria: 'Café',
      codigoTrazabilidad: null,
      precio: 2600,
    });
    publicar$.complete();
    fixture.detectChanges();

    expect(filas()[0].slice(0, 2)).toEqual(['Latte', 'Café']);
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
    expect(menuService.publicar).not.toHaveBeenCalled();
    expect(filas().length).toBe(2);
    const errores = [...pagina.querySelectorAll('.campo__error')].map((e) => e.textContent!.trim());
    expect(errores).toEqual(['Ingresá el nombre del ítem.', 'Ingresá el precio.']);
  });

  it('publica un ítem sin código y lo muestra con guion', () => {
    escribir('item-nombre', 'Tostada francesa');
    pagina.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1].click();
    escribir('item-precio', '2500');
    clic('Publicar ítem');

    expect(menuService.publicar).toHaveBeenCalledWith({
      nombre: 'Tostada francesa',
      categoria: 'Otra comida',
      codigoTrazabilidad: null,
      precio: 2500,
    });
    expect(filas()[0]).toEqual(['Tostada francesa', 'Otra comida', '—', formatearColones(2500)]);
    expect(filas().length).toBe(3);
    expect(pagina.querySelector<HTMLInputElement>('#item-nombre')!.value).toBe('');
  });

  it('publica un café con su código de trazabilidad', () => {
    escribir('item-nombre', 'Latte');
    escribir('item-codigo', 'CRH-2026-0098-T01');
    escribir('item-precio', '2600');
    clic('Publicar ítem');

    expect(menuService.publicar).toHaveBeenCalledWith({
      nombre: 'Latte',
      categoria: 'Café',
      codigoTrazabilidad: 'CRH-2026-0098-T01',
      precio: 2600,
    });
    expect(filas()[0].slice(0, 3)).toEqual(['Latte', 'Café', 'CRH-2026-0098-T01']);
  });

  it('muestra el mensaje del backend junto al código cuando el lote no existe', () => {
    menuService.publicar.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            statusText: 'Not Found',
            error: { mensaje: 'No hay un lote activo con el código CRH-0000.' },
          }),
      ),
    );

    escribir('item-nombre', 'Latte');
    escribir('item-codigo', 'CRH-0000');
    escribir('item-precio', '2600');
    clic('Publicar ítem');

    expect(filas().length).toBe(2);
    expect(pagina.querySelector('#error-codigo')?.textContent).toContain(
      'No hay un lote activo con el código CRH-0000.',
    );
  });

  it('muestra un error general del formulario si publicar falla por otra causa', () => {
    menuService.publicar.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            statusText: 'Error',
            error: { mensaje: 'No se pudo publicar.' },
          }),
      ),
    );

    escribir('item-nombre', 'Latte');
    escribir('item-precio', '2600');
    clic('Publicar ítem');

    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain('No se pudo publicar.');
    expect(pagina.querySelector('#error-codigo')).toBeNull();
  });

  it('Cancelar limpia el formulario', () => {
    escribir('item-nombre', 'Algo');
    clic('Cancelar');
    expect(pagina.querySelector<HTMLInputElement>('#item-nombre')!.value).toBe('');
  });

  it('Quitar elimina el ítem de la tabla solo si el DELETE responde OK', () => {
    const primero = filas()[0][0];
    pagina.querySelector<HTMLButtonElement>('tbody tr button')!.click();
    fixture.detectChanges();

    expect(menuService.quitar).toHaveBeenCalledWith('menu-1');
    expect(filas().length).toBe(1);
    expect(filas().some(([nombre]) => nombre === primero)).toBeFalse();
  });

  it('muestra error si quitar falla y conserva el ítem', () => {
    menuService.quitar.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            statusText: 'Error',
            error: { mensaje: 'No se pudo quitar el ítem.' },
          }),
      ),
    );

    pagina.querySelector<HTMLButtonElement>('tbody tr button')!.click();
    fixture.detectChanges();

    expect(filas().length).toBe(2);
    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo quitar el ítem.',
    );
  });
});
