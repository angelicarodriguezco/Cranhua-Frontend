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
