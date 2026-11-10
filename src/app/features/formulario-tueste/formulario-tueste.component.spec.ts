import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';

import { LOTES_COMPRADOS } from '../../core/mocks/tueste.mock';
import { FormularioTuesteComponent, RUTA_MIS_TOSTADOS } from './formulario-tueste.component';

describe('FormularioTuesteComponent', () => {
  let fixture: ComponentFixture<FormularioTuesteComponent>;
  let pagina: HTMLElement;

  async function crear(id: string | null, lote: string | null = null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [FormularioTuesteComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
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

    it('muestra el título, los lotes comprados y los tres niveles', () => {
      expect(campo('h1').textContent).toContain('Crear tueste');
      expect(campo<HTMLSelectElement>('#lote-tueste').disabled).toBeFalse();
      expect(campo<HTMLSelectElement>('#lote-tueste').options.length).toBe(
        LOTES_COMPRADOS.length + 1,
      );
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

    it('no deja que el peso verde supere los kg del lote', () => {
      elegirLote(2); // Monte Alto, 30 kg
      escribir('#peso-verde', '31');
      expect(errores()).toContain('El lote tiene 30 kg; el peso verde no puede ser mayor.');

      escribir('#peso-verde', '30');
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
      elegirLote(1); // La Catalina, ya tiene dos tuestes
      elegirNivel('Oscuro');
      escribir('#peso-verde', '10');
      escribir('#peso-tostado', '8.4');
      enviar();
    }

    it('guarda sin notas y muestra el código en un diálogo sobre el formulario', () => {
      llenarYGuardar();

      expect(dialogo().open).toBeTrue();
      expect(campo('dialog h2').textContent).toContain('Tueste guardado');
      expect(campo('dialog .codigo').textContent!.trim()).toBe('CRH-2026-0101-T03');
      expect(pagina.querySelector('form')).not.toBeNull();
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
      // Esc dispara cancel en el <dialog>
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

  describe('al editar', () => {
    beforeEach(() => crear('tu-catalina-1'));

    it('carga el tueste con el lote bloqueado', () => {
      expect(campo('h1').textContent).toContain('Editar tueste');
      const lote = campo<HTMLSelectElement>('#lote-tueste');
      expect(lote.disabled).toBeTrue();
      expect(lote.selectedOptions[0].textContent).toContain('CRH-2026-0101');
      expect(nivelElegido()).toBe('Medio');
      expect(campo<HTMLInputElement>('#peso-verde').value).toBe('12');
      expect(campo<HTMLInputElement>('#peso-tostado').value).toBe('10.2');
      expect(campo<HTMLInputElement>('#fecha-tueste').value).toBe('2026-10-21');
      expect(campo<HTMLTextAreaElement>('#notas-tueste').value).toContain('primer crack');
      expect(campo('#merma').textContent!.trim()).toBe('15%');
      expect(campo('button[type="submit"]').textContent).toContain('Guardar cambios');
    });

    it('aplica las mismas validaciones de pesos', () => {
      escribir('#peso-verde', '61');
      escribir('#peso-tostado', '70');
      enviar();
      expect(errores()).toEqual([
        'El lote tiene 60 kg; el peso verde no puede ser mayor.',
        'El peso tostado no puede ser mayor al peso verde.',
      ]);
      expect(dialogo().open).toBeFalse();
    });

    it('guarda los cambios y mantiene el código del tueste', () => {
      escribir('#notas-tueste', '');
      enviar();
      expect(dialogo().open).toBeTrue();
      expect(campo('dialog h2').textContent).toContain('Cambios guardados');
      expect(campo('dialog .codigo').textContent!.trim()).toBe('CRH-2026-0101-T01');
    });

    it('Seguir editando cierra el diálogo sin borrar los datos', () => {
      enviar();
      botonDelDialogo('Seguir editando').click();
      fixture.detectChanges();

      expect(dialogo().open).toBeFalse();
      expect(campo<HTMLInputElement>('#peso-verde').value).toBe('12');
      expect(campo<HTMLSelectElement>('#lote-tueste').disabled).toBeTrue();
    });
  });

  it('llega con el lote elegido desde Mis tostados', async () => {
    await crear(null, 'l-los-robles-catuai');
    expect(campo<HTMLSelectElement>('#lote-tueste').selectedOptions[0].textContent).toContain(
      'CRH-2026-0103',
    );
  });

  it('ignora un lote que no es del tostador', async () => {
    await crear(null, 'l-ajeno');
    expect(campo<HTMLSelectElement>('#lote-tueste').selectedIndex).toBe(0);
  });

  it('avisa si el tueste a editar no existe', async () => {
    await crear('no-existe');
    expect(pagina.querySelector('form')).toBeNull();
    expect(pagina.textContent).toContain('No encontramos ese tueste');
  });
});
