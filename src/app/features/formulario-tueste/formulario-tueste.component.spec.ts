import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ErrorTueste, LoteConKgPorTostar, Tueste } from '../../core/models/tueste.model';
import { TuesteService } from '../../core/services/tueste.service';
import { FormularioTuesteComponent, RUTA_MIS_TOSTADOS } from './formulario-tueste.component';

const LOTES: LoteConKgPorTostar[] = [
  {
    id: 'l-catalina-caturra',
    codigoLote: 'CRH-2026-0101',
    finca: 'La Catalina',
    variedad: 'Caturra',
    proceso: null,
    kg: 60,
    fechaCompra: '2026-10-06',
    codigoTrazabilidad: 'CRH-2026-0101',
    kgPorTostar: 33,
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
    kgPorTostar: 25,
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
    kgPorTostar: 45,
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
    kgPorTostar: 25,
  },
];

const TUESTE_GUARDADO: Tueste = {
  id: 'tu-nuevo',
  loteId: 'l-catalina-caturra',
  nivel: 'Oscuro',
  pesoVerdeKg: 10,
  pesoTostadoKg: 8.4,
  fecha: '2026-11-20',
  notas: null,
  codigoTrazabilidad: 'CRH-2026-0101',
};

describe('FormularioTuesteComponent', () => {
  let fixture: ComponentFixture<FormularioTuesteComponent>;
  let pagina: HTMLElement;
  let tuesteService: jasmine.SpyObj<TuesteService>;

  async function crear(
    id: string | null,
    lote: string | null = null,
    lotes: LoteConKgPorTostar[] = LOTES,
    encontrado: { tueste: Tueste; lote: LoteConKgPorTostar } | null = null,
  ): Promise<void> {
    tuesteService = jasmine.createSpyObj<TuesteService>('TuesteService', [
      'lotesConKgPorTostar',
      'registrar',
      'actualizar',
      'obtener',
    ]);
    tuesteService.lotesConKgPorTostar.and.returnValue(of(lotes));
    tuesteService.registrar.and.returnValue(of(TUESTE_GUARDADO));
    tuesteService.actualizar.and.returnValue(of(TUESTE_GUARDADO));
    tuesteService.obtener.and.returnValue(of(encontrado));

    await TestBed.configureTestingModule({
      imports: [FormularioTuesteComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TuesteService, useValue: tuesteService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id }),
              queryParamMap: convertToParamMap({ lote }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioTuesteComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  }

  function campo<T extends HTMLElement>(selector: string): T {
    return pagina.querySelector<T>(selector)!;
  }

  function escribir(selector: string, valor: string): void {
    const input = campo<HTMLInputElement>(selector);
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function elegirLote(indice: number): void {
    const select = campo<HTMLSelectElement>('#lote-tueste');
    select.selectedIndex = indice;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function niveles(): HTMLLabelElement[] {
    return [...pagina.querySelectorAll<HTMLLabelElement>('.nivel')];
  }

  function nivelElegido(): string | undefined {
    return niveles()
      .find((n) => n.querySelector('input')!.checked)
      ?.textContent!.trim();
  }

  function elegirNivel(nivel: string): void {
    niveles()
      .find((n) => n.textContent!.trim() === nivel)!
      .querySelector('input')!
      .click();
    fixture.detectChanges();
  }

  function errores(): string[] {
    return [...pagina.querySelectorAll('.campo__error')].map((e) => e.textContent!.trim());
  }

  function dialogo(): HTMLDialogElement {
    return campo<HTMLDialogElement>('dialog');
  }

  function botonDelDialogo(texto: string): HTMLButtonElement {
    return [...dialogo().querySelectorAll('button')].find((b) => b.textContent!.trim() === texto)!;
  }

  function enviar(): void {
    campo<HTMLButtonElement>('button[type="submit"]').click();
    fixture.detectChanges();
  }

  describe('al crear', () => {
    beforeEach(() => crear(null));

    it('muestra el título, solo lotes con kg por tostar y los tres niveles', () => {
      expect(campo('h1').textContent).toContain('Crear tueste');
      expect(campo<HTMLSelectElement>('#lote-tueste').disabled).toBeFalse();
      expect(campo<HTMLSelectElement>('#lote-tueste').options.length).toBe(LOTES.length + 1);
      expect(campo<HTMLSelectElement>('#lote-tueste').options[1].textContent).toContain('33 kg');
      expect(campo<HTMLSelectElement>('#lote-tueste').options[1].textContent).toContain('Caturra');
      expect(campo<HTMLSelectElement>('#lote-tueste').options[1].textContent).not.toContain('null');
      expect(niveles().map((n) => n.textContent!.trim())).toEqual(['Claro', 'Medio', 'Oscuro']);
      expect(niveles().every((n) => n.querySelector('input')!.type === 'radio')).toBeTrue();
      expect(nivelElegido()).toBeUndefined();
      expect(campo('button[type="submit"]').textContent).toContain('Guardar tueste');
    });

    it('permite un solo nivel de tueste', () => {
      elegirNivel('Claro');
      elegirNivel('Oscuro');
      expect(nivelElegido()).toBe('Oscuro');
      expect(pagina.querySelectorAll('.nivel input:checked').length).toBe(1);
    });

    it('calcula la merma a partir de los dos pesos', () => {
      expect(campo('#merma').textContent!.trim()).toBe('—');
      escribir('#peso-verde', '12');
      escribir('#peso-tostado', '10.2');
      expect(campo('#merma').textContent!.trim()).toBe('15%');
    });

    it('no deja que el peso tostado sea mayor al verde', () => {
      escribir('#peso-verde', '5');
      escribir('#peso-tostado', '6');
      expect(errores()).toContain('El peso tostado no puede ser mayor al peso verde.');
      expect(campo('#merma').textContent!.trim()).toBe('—');
    });

    it('no deja que el peso verde supere el kg restante del lote', () => {
      elegirLote(2);
      escribir('#peso-verde', '26');
      expect(errores()).toContain('El lote tiene 25 kg; el peso verde no puede ser mayor.');

      escribir('#peso-verde', '25');
      expect(errores()).toEqual([]);
    });

    it('no guarda si faltan campos obligatorios', () => {
      enviar();
      expect(errores()).toEqual([
        'Elegí el lote que vas a tostar.',
        'Elegí un nivel de tueste.',
        'Ingresá el peso verde.',
        'Ingresá el peso tostado.',
      ]);
      expect(dialogo().open).toBeFalse();
    });

    function llenarYGuardar(): void {
      elegirLote(1);
      elegirNivel('Oscuro');
      escribir('#peso-verde', '10');
      escribir('#peso-tostado', '8.4');
      enviar();
    }

    it('guarda sin notas y muestra el código del lote en un diálogo', () => {
      llenarYGuardar();

      expect(tuesteService.registrar).toHaveBeenCalledWith({
        loteId: 'l-catalina-caturra',
        nivel: 'Oscuro',
        pesoVerdeKg: 10,
        pesoTostadoKg: 8.4,
        fecha: jasmine.any(String),
        notas: null,
      });
      expect(dialogo().open).toBeTrue();
      expect(campo('dialog h2').textContent).toContain('Tueste guardado');
      expect(campo('dialog .codigo').textContent!.trim()).toBe('CRH-2026-0101');
      expect(pagina.querySelector('form')).not.toBeNull();
    });

    it('muestra errores de peso del API al guardar', () => {
      const error: ErrorTueste = {
        mensaje: 'Revisá los pesos.',
        errores: {
          pesoVerdeKg: 'Supera el kg disponible del lote.',
          pesoTostadoKg: 'Debe ser menor que el peso verde.',
        },
      };
      tuesteService.registrar.and.returnValue(throwError(() => error));
      llenarYGuardar();

      expect(dialogo().open).toBeFalse();
      expect(errores()).toEqual([
        'Supera el kg disponible del lote.',
        'Debe ser menor que el peso verde.',
      ]);
    });

    it('Registrar otro tueste cierra el diálogo y limpia el formulario', () => {
      llenarYGuardar();
      botonDelDialogo('Registrar otro tueste').click();
      fixture.detectChanges();

      expect(dialogo().open).toBeFalse();
      expect(campo<HTMLSelectElement>('#lote-tueste').selectedIndex).toBe(0);
      expect(campo<HTMLInputElement>('#peso-verde').value).toBe('');
      expect(nivelElegido()).toBeUndefined();
    });

    it('cerrar el diálogo con Esc también limpia el formulario', () => {
      llenarYGuardar();
      dialogo().dispatchEvent(new Event('cancel', { cancelable: true }));
      fixture.detectChanges();

      expect(campo<HTMLInputElement>('#peso-verde').value).toBe('');
      expect(dialogo().open).toBeFalse();
    });

    it('Cancelar vuelve a Mis tostados', () => {
      const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl');
      [...pagina.querySelectorAll<HTMLButtonElement>('.acciones button')]
        .find((b) => b.textContent!.trim() === 'Cancelar')!
        .click();
      expect(navegar).toHaveBeenCalledWith(RUTA_MIS_TOSTADOS);
    });
  });

  it('llega con el lote elegido desde Mis tostados después de cargar', async () => {
    await crear(null, 'l-los-robles-catuai');
    expect(campo<HTMLSelectElement>('#lote-tueste').selectedOptions[0].textContent).toContain(
      'CRH-2026-0103',
    );
  });

  it('ignora un lote sin kg por tostar o ajeno', async () => {
    await crear(null, 'l-ajeno');
    expect(campo<HTMLSelectElement>('#lote-tueste').selectedIndex).toBe(0);
  });

  it('no incluye en el selector lotes sin kg restante', async () => {
    await crear(null, null, LOTES.slice(0, 2));
    expect(campo<HTMLSelectElement>('#lote-tueste').options.length).toBe(3);
    expect(tuesteService.lotesConKgPorTostar).toHaveBeenCalled();
  });

  it('avisa si el tueste a editar no existe', async () => {
    await crear('no-existe');
    expect(pagina.querySelector('form')).toBeNull();
    expect(pagina.textContent).toContain('No encontramos ese tueste');
  });

  describe('al editar', () => {
    beforeEach(() => crear('tu-nuevo', null, LOTES, { tueste: TUESTE_GUARDADO, lote: LOTES[0] }));

    it('reutiliza el formulario de registro con los datos reales del tueste', () => {
      expect(campo('h1').textContent).toBe('Editar tueste');
      const lote = campo<HTMLSelectElement>('#lote-tueste');
      expect(lote.disabled).toBeTrue();
      expect(lote.selectedOptions[0].textContent).toContain('CRH-2026-0101');
      expect(nivelElegido()).toBe('Oscuro');
      expect(tuesteService.lotesConKgPorTostar).not.toHaveBeenCalled();
    });

    it('valida el peso verde contra los kg del lote sin contar este tueste', () => {
      escribir('#peso-verde', '34');
      enviar();

      expect(errores()).toContain('El lote tiene 33 kg; el peso verde no puede ser mayor.');
      expect(tuesteService.actualizar).not.toHaveBeenCalled();
    });

    it('muestra el rechazo del backend por pedidos de cafeterías', () => {
      const mensaje = 'El peso tostado no puede ser menor a los kg ya pedidos por cafeterías.';
      tuesteService.actualizar.and.returnValue(throwError(() => ({ mensaje, errores: {} })));

      escribir('#peso-tostado', '1');
      enviar();

      expect(tuesteService.actualizar).toHaveBeenCalledWith(
        'tu-nuevo',
        jasmine.objectContaining({ pesoTostadoKg: 1 }),
      );
      expect(campo('[role="alert"]').textContent!.trim()).toBe(mensaje);
      expect(dialogo().open).toBeFalse();
    });
  });
});
