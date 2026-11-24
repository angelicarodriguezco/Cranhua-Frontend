import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterLink, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ErrorTueste, LoteComprado, LotesComprados, Tueste } from '../../core/models/tueste.model';
import { TuesteService } from '../../core/services/tueste.service';
import { conSesionDeEjemplo } from '../../core/testing/sesion-de-ejemplo';
import { MisTostadosComponent } from './mis-tostados.component';

const LOTES: LoteComprado[] = [
  {
    id: 'l-catalina-caturra',
    codigoLote: 'CRH-2026-0101',
    finca: 'La Catalina',
    variedad: 'Caturra',
    proceso: null,
    kg: 60,
    fechaCompra: '2026-10-06',
    codigoTrazabilidad: 'CRH-2026-0101',
  },
  {
    id: 'l-monte-alto-geisha',
    codigoLote: 'CRH-2026-0102',
    finca: 'Monte Alto',
    variedad: 'Geisha',
    proceso: null,
    kg: 30,
    fechaCompra: '2026-10-14',
    codigoTrazabilidad: 'CRH-2026-0102',
  },
  {
    id: 'l-los-robles-catuai',
    codigoLote: 'CRH-2026-0103',
    finca: 'Los Robles',
    variedad: 'Catuaí',
    proceso: null,
    kg: 45,
    fechaCompra: '2026-10-22',
    codigoTrazabilidad: null,
  },
  {
    id: 'l-cerro-verde-bourbon',
    codigoLote: 'CRH-2026-0104',
    finca: 'Cerro Verde',
    variedad: 'Bourbon',
    proceso: null,
    kg: 25,
    fechaCompra: '2026-10-29',
    codigoTrazabilidad: null,
  },
  {
    id: 'l-el-cedral-villa-sarchi',
    codigoLote: 'CRH-2026-0098',
    finca: 'El Cedral',
    variedad: 'Villa Sarchí',
    proceso: null,
    kg: 40,
    fechaCompra: '2026-09-18',
    codigoTrazabilidad: 'CRH-2026-0098',
  },
];

const INDICADORES = { lotes: 5, kg: 200, conCodigo: 3 };

const TUESTES_CATALINA: Tueste[] = [
  {
    id: 'tu-catalina-1',
    loteId: 'l-catalina-caturra',
    nivel: 'Medio',
    pesoVerdeKg: 12,
    pesoTostadoKg: 10.2,
    fecha: '2026-10-21',
    notas: 'Desarrollo de 1:45 después del primer crack.',
    codigoTrazabilidad: 'CRH-2026-0101',
  },
  {
    id: 'tu-catalina-2',
    loteId: 'l-catalina-caturra',
    nivel: 'Oscuro',
    pesoVerdeKg: 15,
    pesoTostadoKg: 12.4,
    fecha: '2026-10-30',
    notas: 'Para espresso de la casa.',
    codigoTrazabilidad: 'CRH-2026-0101',
  },
];

describe('MisTostadosComponent', () => {
  let fixture: ComponentFixture<MisTostadosComponent>;
  let pagina: HTMLElement;
  let tuesteService: jasmine.SpyObj<TuesteService>;

  beforeEach(async () => {
    tuesteService = jasmine.createSpyObj<TuesteService>('TuesteService', [
      'lotesComprados',
      'generarCodigo',
      'tuestesDelLote',
      'actualizar',
    ]);
    tuesteService.lotesComprados.and.returnValue(
      of<LotesComprados>({ indicadores: INDICADORES, lotes: LOTES }),
    );
    tuesteService.generarCodigo.and.callFake((id) => {
      const lote = LOTES.find((l) => l.id === id)!;
      return of({
        lote: { ...lote, codigoTrazabilidad: lote.codigoLote },
        tostador: 'Mario Brenes',
      });
    });
    tuesteService.tuestesDelLote.and.callFake((loteId) =>
      of(TUESTES_CATALINA.filter((t) => t.loteId === loteId)),
    );
    tuesteService.actualizar.and.callFake((id, cambios) => {
      const actual = TUESTES_CATALINA.find((t) => t.id === id)!;
      return of({ ...actual, ...cambios });
    });

    await TestBed.configureTestingModule({
      imports: [MisTostadosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TuesteService, useValue: tuesteService },
      ],
    }).compileComponents();

    conSesionDeEjemplo();
    fixture = TestBed.createComponent(MisTostadosComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  function texto(selector: string): string {
    return pagina.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function fila(codigoLote: string): HTMLTableRowElement {
    const encontrada = [
      ...pagina.querySelectorAll<HTMLTableRowElement>('.tabla-lotes tbody tr'),
    ].find((tr) => tr.cells[0].textContent!.trim() === codigoLote);
    if (!encontrada) {
      throw new Error(`No hay fila para ${codigoLote}`);
    }
    return encontrada;
  }

  function boton(contenedor: HTMLElement, etiqueta: string): HTMLButtonElement {
    return [...contenedor.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent!.trim() === etiqueta,
    )!;
  }

  function clic(elemento: HTMLElement): void {
    elemento.click();
    fixture.detectChanges();
  }

  function dialogo(): HTMLDialogElement {
    return pagina.querySelector(':scope > dialog')!;
  }

  function href(selector: string): string {
    return fixture.debugElement.query(By.css(selector)).injector.get(RouterLink).href ?? '';
  }

  it('muestra los 3 indicadores del API', () => {
    const indicadores = [...pagina.querySelectorAll('.indicadores article')].map((a) => [
      a.querySelector('strong')!.textContent!.trim(),
      a.querySelector('span')!.textContent!.trim(),
    ]);
    expect(indicadores).toEqual([
      ['5', 'Lotes comprados'],
      ['200 kg', 'Kg comprados'],
      ['3', 'Lotes con código'],
    ]);
  });

  it('lista los lotes con su estado de trazabilidad', () => {
    expect(pagina.querySelectorAll('.tabla-lotes tbody tr').length).toBeGreaterThanOrEqual(4);

    const catalina = fila('CRH-2026-0101');
    expect(catalina.cells[1].textContent!.trim()).toBe('La Catalina');
    expect(catalina.cells[2].textContent!.trim()).toBe('60 kg');
    expect(catalina.cells[4].textContent!.trim()).toBe('Con código');
    expect(boton(catalina, 'Generar código')).toBeUndefined();

    const robles = fila('CRH-2026-0103');
    expect(robles.cells[4].textContent!.trim()).toBe('Pendiente');
    expect(boton(robles, 'Generar código')).toBeDefined();
  });

  it('muestra la fecha de compra sin correrse un día por la zona horaria', () => {
    expect(fila('CRH-2026-0101').cells[3].textContent!.trim()).toBe('6 oct 2026');
  });

  describe('al generar el código', () => {
    beforeEach(() => clic(boton(fila('CRH-2026-0103'), 'Generar código')));

    it('abre la ficha en un diálogo con el código del backend', () => {
      expect(dialogo().open).toBeTrue();
      expect(pagina.querySelector('.tabla-lotes')).not.toBeNull();
      expect(texto(':scope > dialog h2')).toBe('Código generado');
      expect(texto('.codigo')).toBe('CRH-2026-0103');

      const datos = Object.fromEntries(
        [...pagina.querySelectorAll('.ficha__datos div')].map((d) => [
          d.querySelector('dt')!.textContent!.trim(),
          d.querySelector('dd')!.textContent!.trim(),
        ]),
      );
      expect(datos).toEqual(
        jasmine.objectContaining({
          'Finca de origen': 'Los Robles',
          Variedad: 'Catuaí',
          Kilos: '45 kg',
          Tostador: 'Mario Brenes',
        }),
      );

      expect(boton(dialogo(), 'Descargar código')).toBeDefined();
      expect(boton(dialogo(), 'Volver a mis lotes')).toBeDefined();
    });

    it('marca el lote con código en la tabla', () => {
      expect(fila('CRH-2026-0103').cells[4].textContent!.trim()).toBe('Con código');
      expect(texto('.indicadores article:last-child strong')).toBe('4');
    });

    it('Volver a mis lotes cierra el diálogo', () => {
      clic(boton(dialogo(), 'Volver a mis lotes'));

      expect(dialogo().open).toBeFalse();
      expect(pagina.querySelector('.ficha')).toBeNull();
    });

    it('Esc también cierra el diálogo', () => {
      // Esc dispara cancel en el <dialog>
      dialogo().dispatchEvent(new Event('cancel', { cancelable: true }));
      fixture.detectChanges();

      expect(dialogo().open).toBeFalse();
    });

    it('Descargar código baja una etiqueta SVG con el código', () => {
      const crearUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:etiqueta');
      const descargar = spyOn(HTMLAnchorElement.prototype, 'click');

      clic(boton(pagina, 'Descargar código'));

      const blob = crearUrl.calls.mostRecent().args[0] as Blob;
      expect(blob.type).toBe('image/svg+xml');
      const enlace = descargar.calls.mostRecent().object as HTMLAnchorElement;
      expect(enlace.download).toBe('trazabilidad-CRH-2026-0103.svg');
    });
  });

  it('Ver código abre la ficha con el código del lote y el tostador de sesión', () => {
    clic(boton(fila('CRH-2026-0102'), 'Ver código'));
    expect(dialogo().open).toBeTrue();
    expect(texto(':scope > dialog h2')).toBe('Código de trazabilidad');
    expect(texto('.codigo')).toBe('CRH-2026-0102');
    expect(texto('.ficha__datos div:nth-child(4) dd')).toBe('Rodrigo Solís Ureña');
  });

  describe('Ver tuestes', () => {
    it('abre el panel con los tuestes del lote y su merma', () => {
      const verTuestes = boton(fila('CRH-2026-0101'), 'Ver tuestes');
      clic(verTuestes);

      expect(verTuestes.getAttribute('aria-expanded')).toBe('true');
      expect(texto('#titulo-tuestes')).toBe('Tuestes del lote CRH-2026-0101');
      expect(texto('.seccion__sub')).toContain('Finca La Catalina · Caturra');
      const filas = [...pagina.querySelectorAll<HTMLTableRowElement>('.tabla-tuestes tbody tr')];
      expect(filas.length).toBe(2);
      expect([...filas[0].cells].slice(0, 5).map((c) => c.textContent!.trim())).toEqual([
        'Medio',
        '12 kg',
        '10,2 kg',
        '15%',
        '21 oct 2026',
      ]);
    });

    describe('Editar', () => {
      function editor(): HTMLDialogElement {
        return pagina.querySelector('app-editar-tueste dialog')!;
      }

      function escribir(selector: string, valor: string): void {
        const input = editor().querySelector<HTMLInputElement>(selector)!;
        input.value = valor;
        input.dispatchEvent(new Event('input'));
        input.dispatchEvent(new Event('blur'));
        fixture.detectChanges();
      }

      function guardar(): void {
        clic(editor().querySelector<HTMLButtonElement>('button[type="submit"]')!);
      }

      beforeEach(() => {
        clic(boton(fila('CRH-2026-0101'), 'Ver tuestes'));
        clic(
          pagina.querySelector<HTMLButtonElement>('.tabla-tuestes tbody tr:first-child button')!,
        );
      });

      it('abre un popup con los datos del tueste', () => {
        expect(editor().open).toBeTrue();
        expect(editor().querySelector('h2')!.textContent).toContain('Editar tueste');
        expect(editor().querySelector('.editor__sub')!.textContent).toContain('CRH-2026-0101');
        expect(editor().querySelector('.nivel:has(input:checked)')!.textContent!.trim()).toBe(
          'Medio',
        );
        expect(editor().querySelector<HTMLInputElement>('#editar-peso-verde')!.value).toBe('12');
        expect(editor().querySelector('#editar-merma')!.textContent!.trim()).toBe('15%');
      });

      it('valida los pesos contra el lote', () => {
        escribir('#editar-peso-verde', '61');
        guardar();

        expect(editor().open).toBeTrue();
        expect(editor().querySelector('.campo__error')!.textContent!.trim()).toBe(
          'El lote tiene 60 kg; el peso verde no puede ser mayor.',
        );
      });

      it('muestra errores de peso del API al guardar', () => {
        const error: ErrorTueste = {
          mensaje: 'Pesos incoherentes',
          errores: {
            pesoVerdeKg: 'El peso verde supera el disponible del lote.',
            pesoTostadoKg: 'El peso tostado no puede superar el verde.',
          },
        };
        tuesteService.actualizar.and.returnValue(throwError(() => error));

        escribir('#editar-peso-tostado', '9');
        guardar();

        expect(editor().open).toBeTrue();
        const mensajes = [...editor().querySelectorAll('.campo__error')].map((e) =>
          e.textContent!.trim(),
        );
        expect(mensajes).toContain('El peso verde supera el disponible del lote.');
        expect(mensajes).toContain('El peso tostado no puede superar el verde.');
      });

      it('guarda, cierra el popup y actualiza la fila', () => {
        escribir('#editar-peso-tostado', '9');
        guardar();

        expect(editor().open).toBeFalse();
        const celdas = pagina.querySelector<HTMLTableRowElement>('.tabla-tuestes tbody tr')!.cells;
        expect(celdas[2].textContent!.trim()).toBe('9 kg');
        expect(celdas[3].textContent!.trim()).toBe('25%');
      });

      it('Cancelar cierra sin guardar', () => {
        escribir('#editar-peso-tostado', '9');
        clic(boton(editor(), 'Cancelar'));

        expect(editor().open).toBeFalse();
        const celdas = pagina.querySelector<HTMLTableRowElement>('.tabla-tuestes tbody tr')!.cells;
        expect(celdas[2].textContent!.trim()).toBe('10,2 kg');
      });
    });

    it('sin tuestes muestra un mensaje y Crear tueste con el lote elegido', () => {
      clic(boton(fila('CRH-2026-0103'), 'Ver tuestes'));

      expect(pagina.querySelector('.tabla-tuestes')).toBeNull();
      expect(texto('.sin-tuestes')).toContain('Todavía no registraste tuestes de este lote.');
      expect(href('.sin-tuestes a')).toBe('/tostador/tostados/nuevo?lote=l-los-robles-catuai');
    });

    it('se cierra con el mismo botón o con Cerrar', () => {
      const verTuestes = boton(fila('CRH-2026-0101'), 'Ver tuestes');
      clic(verTuestes);
      clic(verTuestes);
      expect(pagina.querySelector('#panel-tuestes')).toBeNull();

      clic(verTuestes);
      clic(boton(pagina.querySelector('#panel-tuestes')!, 'Cerrar'));
      expect(pagina.querySelector('#panel-tuestes')).toBeNull();
    });
  });

  it('explica el código y enlaza a Crear tueste y Explorar cosechas', () => {
    expect(texto('.explicacion h2')).toBe('¿Para qué sirve el código?');
    const enlaces = fixture.debugElement
      .queryAll(By.css('.explicacion a'))
      .map((a) => [a.nativeElement.textContent.trim(), a.injector.get(RouterLink).href]);
    expect(enlaces).toEqual([
      ['Explorar cosechas', '/tostador/cosechas'],
      ['Crear tueste', '/tostador/tostados/nuevo'],
    ]);
  });
});
