import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  DatosPasoSeleccion,
  PasoSeleccionCatacionComponent,
  calcularMermaPorcentaje,
} from './paso-seleccion-catacion.component';

describe('PasoSeleccionCatacionComponent', () => {
  let fixture: ComponentFixture<PasoSeleccionCatacionComponent>;
  let pagina: HTMLElement;
  let componente: PasoSeleccionCatacionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasoSeleccionCatacionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PasoSeleccionCatacionComponent);
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  function rellenarPesos(antes = 120, despues = 96): void {
    componente['formulario'].patchValue({
      pesoAntesKg: antes,
      pesoTrasSeleccionKg: despues,
      precioKg: 4500,
    });
    fixture.detectChanges();
  }

  it('muestra pesos, merma, caracolillo y catación', () => {
    expect(pagina.querySelectorAll('.tarjeta').length).toBe(3);
    expect(pagina.textContent).toContain('Selección por tamaño y defectos');
    expect(pagina.querySelector('#cosecha-precio')).toBeTruthy();
    expect(pagina.textContent).toContain('Catación SCA');
    expect(pagina.textContent).toContain('Merma calculada por selección');
    expect(pagina.querySelector('#cosecha-peso-antes')).toBeTruthy();
    expect(pagina.querySelector('#cosecha-peso-despues')).toBeTruthy();
    expect(pagina.querySelector('#cosecha-merma')).toBeTruthy();
    expect(pagina.querySelector('#cosecha-caracolillo')).toBeTruthy();
    expect(pagina.querySelector('#cosecha-sca')).toBeTruthy();
    expect(pagina.querySelector('#cosecha-notas')).toBeTruthy();
    expect(pagina.querySelector('button[type="submit"]')?.textContent?.trim()).toBe(
      'Guardar cosecha',
    );
  });

  it('calcula la merma a partir de los pesos', () => {
    expect(calcularMermaPorcentaje(0, 10)).toBe(0);
    expect(calcularMermaPorcentaje(100, 80)).toBe(20);

    rellenarPesos(100, 75);
    expect(componente['mermaPorcentaje']()).toBe(25);
    expect(pagina.querySelector('#cosecha-merma')?.textContent).toContain('25');
  });

  it('no invalida el formulario si caracolillo y catación quedan vacíos', () => {
    const emitidos: DatosPasoSeleccion[] = [];
    componente.guardar.subscribe((datos) => emitidos.push(datos));

    rellenarPesos(120, 96);
    expect(componente['formulario'].valid).toBe(true);

    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(emitidos).toEqual([
      {
        pesoAntesKg: 120,
        pesoTrasSeleccionKg: 96,
        separoCaracolillo: null,
        pesoCaracolilloKg: null,
        puntajeSca: null,
        notasCatacion: null,
        precioKg: 4500,
      },
    ]);
  });

  it('exige un precio por kg mayor a 0 con hasta 2 decimales', () => {
    const precio = componente['formulario'].controls.precioKg;
    rellenarPesos();

    for (const invalido of [null, 0, 12.345]) {
      precio.setValue(invalido);
      expect(precio.invalid).withContext(String(invalido)).toBeTrue();
    }
    precio.setValue(4500.5);
    expect(precio.valid).toBeTrue();

    precio.setValue(0);
    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
    expect(pagina.querySelector('#cosecha-precio')?.parentElement?.textContent).toContain(
      'Indicá un precio mayor a 0',
    );
  });

  it('muestra los errores del servidor debajo de su campo', () => {
    fixture.componentRef.setInput('erroresServidor', {
      pesoTrasSeleccionKg:
        'El peso tras la selección no puede ser mayor al peso tras el beneficiado.',
      precioKg: 'El precio por kg tiene que ser mayor a 0.',
    });
    fixture.detectChanges();

    expect(pagina.querySelector('#cosecha-peso-despues')?.parentElement?.textContent).toContain(
      'no puede ser mayor al peso tras el beneficiado',
    );
    expect(pagina.querySelector('#cosecha-precio')?.parentElement?.textContent).toContain(
      'El precio por kg tiene que ser mayor a 0.',
    );
  });

  it('mientras guarda deshabilita los botones y no vuelve a emitir', () => {
    const emitidos: DatosPasoSeleccion[] = [];
    componente.guardar.subscribe((datos) => emitidos.push(datos));
    rellenarPesos();
    fixture.componentRef.setInput('guardando', true);
    fixture.detectChanges();

    const guardar = pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(guardar.disabled).toBeTrue();
    expect(guardar.textContent?.trim()).toBe('Guardando…');
    componente['enviar']();
    expect(emitidos).toEqual([]);
  });

  it('exige peso de caracolillo solo cuando la respuesta es Sí', () => {
    const emitidos: DatosPasoSeleccion[] = [];
    componente.guardar.subscribe((datos) => emitidos.push(datos));

    rellenarPesos(120, 96);
    componente['formulario'].patchValue({ separoCaracolillo: 'si' });
    fixture.detectChanges();

    expect(pagina.querySelector('#cosecha-peso-caracolillo')).toBeTruthy();

    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
    expect(emitidos).toEqual([]);
    expect(componente['formulario'].hasError('pesoCaracolilloRequerido')).toBe(true);

    componente['formulario'].patchValue({ pesoCaracolilloKg: 4 });
    fixture.detectChanges();
    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(emitidos).toEqual([
      {
        pesoAntesKg: 120,
        pesoTrasSeleccionKg: 96,
        separoCaracolillo: true,
        pesoCaracolilloKg: 4,
        puntajeSca: null,
        notasCatacion: null,
        precioKg: 4500,
      },
    ]);
  });

  it('exige pesos antes y tras la selección de al menos 0.01 kg', () => {
    const controles = componente['formulario'].controls;
    rellenarPesos(0, 0);
    expect(controles.pesoAntesKg.hasError('min')).toBeTrue();
    expect(controles.pesoTrasSeleccionKg.hasError('min')).toBeTrue();

    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
    expect(pagina.textContent).toContain('Indicá un peso antes de la selección mayor a 0.');
    expect(pagina.textContent).toContain('Indicá un peso tras la selección mayor a 0.');

    rellenarPesos(0.01, 0.01);
    expect(controles.pesoAntesKg.valid).toBeTrue();
    expect(controles.pesoTrasSeleccionKg.valid).toBeTrue();
  });

  it('con caracolillo Sí exige un peso de al menos 0.01 kg y con No lo ignora', () => {
    const formulario = componente['formulario'];
    rellenarPesos(120, 96);
    formulario.patchValue({ separoCaracolillo: 'si', pesoCaracolilloKg: 0 });
    fixture.detectChanges();
    expect(formulario.hasError('pesoCaracolilloInvalido')).toBeTrue();

    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
    expect(pagina.textContent).toContain('Indicá un peso de caracolillo mayor a 0.');

    formulario.patchValue({ pesoCaracolilloKg: 0.01 });
    expect(formulario.valid).toBeTrue();

    formulario.patchValue({ separoCaracolillo: 'no', pesoCaracolilloKg: 0 });
    expect(formulario.valid).toBeTrue();
  });

  it('precarga el peso antes sugerido desde el paso 1', () => {
    fixture.componentRef.setInput('pesoAntesSugerido', 150);
    fixture.detectChanges();

    expect(componente['formulario'].controls.pesoAntesKg.value).toBe(150);
  });

  it('emite atras al pulsar Atrás', () => {
    let atras = 0;
    componente.atras.subscribe(() => atras++);

    const botones = pagina.querySelectorAll<HTMLButtonElement>('button[type="button"]');
    const atrasBtn = [...botones].find((b) => b.textContent?.trim() === '← Atrás');
    atrasBtn!.click();

    expect(atras).toBe(1);
  });
});
