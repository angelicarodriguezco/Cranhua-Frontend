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
    });
    fixture.detectChanges();
  }

  it('muestra pesos, merma, caracolillo y catación', () => {
    expect(pagina.querySelectorAll('.tarjeta').length).toBe(2);
    expect(pagina.textContent).toContain('Selección por tamaño y defectos');
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
      },
    ]);
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
      },
    ]);
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
