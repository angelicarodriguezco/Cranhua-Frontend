import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalConfirmacionComponent } from './modal-confirmacion.component';

describe('ModalConfirmacionComponent', () => {
  let fixture: ComponentFixture<ModalConfirmacionComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalConfirmacionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalConfirmacionComponent);
    fixture.componentRef.setInput('titulo', '¿Eliminar cosecha?');
    fixture.componentRef.setInput('mensaje', 'Esta acción no se puede deshacer.');
    fixture.componentRef.setInput('etiquetaConfirmar', 'Eliminar');
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('renderiza título, mensaje y acciones', () => {
    expect(pagina.querySelector('.modal__titulo')?.textContent).toBe('¿Eliminar cosecha?');
    expect(pagina.querySelector('.modal__mensaje')?.textContent).toContain('no se puede deshacer');
    expect(pagina.textContent).toContain('Cancelar');
    expect(pagina.textContent).toContain('Eliminar');
    expect(pagina.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('emite cancelar desde el botón', () => {
    const spy = jasmine.createSpy('cancelar');
    fixture.componentInstance.cancelar.subscribe(spy);

    pagina.querySelector<HTMLButtonElement>('.modal__btn--secundario')!.click();

    expect(spy).toHaveBeenCalled();
  });

  it('emite confirmar desde el botón destructivo', () => {
    const spy = jasmine.createSpy('confirmar');
    fixture.componentInstance.confirmar.subscribe(spy);

    pagina.querySelector<HTMLButtonElement>('.modal__btn--peligro')!.click();

    expect(spy).toHaveBeenCalled();
  });

  it('emite cancelar con Escape', () => {
    const spy = jasmine.createSpy('cancelar');
    fixture.componentInstance.cancelar.subscribe(spy);

    fixture.componentInstance['onDocumentKeydown'](new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(spy).toHaveBeenCalled();
  });

  it('emite cancelar al hacer clic en el backdrop', () => {
    const spy = jasmine.createSpy('cancelar');
    fixture.componentInstance.cancelar.subscribe(spy);

    pagina.querySelector<HTMLElement>('.modal__backdrop')!.click();

    expect(spy).toHaveBeenCalled();
  });
});

describe('ModalConfirmacionComponent con tipo, nombre y aviso', () => {
  let fixture: ComponentFixture<ModalConfirmacionComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalConfirmacionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalConfirmacionComponent);
    fixture.componentRef.setInput('tipo', 'Cafetería');
    fixture.componentRef.setInput('nombre', 'Café Brumas');
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  function texto(selector: string): string {
    return pagina.querySelector(selector)?.textContent?.trim() ?? '';
  }

  function describidoPor(): string[] {
    return (pagina.querySelector('[role="dialog"]')!.getAttribute('aria-describedby') ?? '').split(
      ' ',
    );
  }

  it('arma el título con tipo y nombre', () => {
    expect(texto('.modal__titulo')).toBe('¿Eliminar Cafetería Café Brumas?');
  });

  it('da prioridad al titulo explícito', () => {
    fixture.componentRef.setInput('titulo', '¿Borrar todo?');
    fixture.detectChanges();
    expect(texto('.modal__titulo')).toBe('¿Borrar todo?');
  });

  it('usa el mensaje y las etiquetas por defecto', () => {
    expect(texto('.modal__mensaje')).toBe('Esta acción no se puede deshacer.');
    expect(texto('.modal__btn--secundario')).toBe('Cancelar');
    expect(texto('.modal__btn--peligro')).toBe('Sí, entiendo. Eliminar');
  });

  it('sin aviso es la variante normal', () => {
    expect(pagina.querySelector('.modal__aviso')).toBeNull();
    expect(describidoPor()).toEqual(['modal-confirmacion-mensaje']);
  });

  it('con aviso muestra el recuadro y lo agrega a aria-describedby', () => {
    fixture.componentRef.setInput('aviso', 'Ya hay códigos de trazabilidad.');
    fixture.detectChanges();

    const aviso = pagina.querySelector('.modal__aviso')!;
    expect(aviso.textContent).toContain('Ya hay códigos de trazabilidad.');
    expect(aviso.id).toBe('modal-confirmacion-aviso');
    expect(describidoPor()).toEqual(['modal-confirmacion-mensaje', 'modal-confirmacion-aviso']);
  });

  it('confirma, cancela y cancela con Escape', () => {
    const confirmar = jasmine.createSpy('confirmar');
    const cancelar = jasmine.createSpy('cancelar');
    fixture.componentInstance.confirmar.subscribe(confirmar);
    fixture.componentInstance.cancelar.subscribe(cancelar);

    pagina.querySelector<HTMLButtonElement>('.modal__btn--peligro')!.click();
    pagina.querySelector<HTMLButtonElement>('.modal__btn--secundario')!.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(confirmar).toHaveBeenCalledTimes(1);
    expect(cancelar).toHaveBeenCalledTimes(2);
  });
});
