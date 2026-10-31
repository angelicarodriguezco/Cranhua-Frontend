import { ComponentFixture, TestBed } from '@angular/core/testing';

import { USUARIOS } from '../../../../core/mocks/finca.mock';
import { ListaDuenosComponent } from './lista-duenos.component';

describe('ListaDuenosComponent', () => {
  let fixture: ComponentFixture<ListaDuenosComponent>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaDuenosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaDuenosComponent);
    fixture.componentRef.setInput('duenos', USUARIOS.slice(0, 2));
    fixture.componentRef.setInput('propietarioId', USUARIOS[0].id);
    fixture.detectChanges();
    elemento = fixture.nativeElement;
  });

  function escribirCorreo(correo: string): void {
    const campo: HTMLInputElement = elemento.querySelector('input')!;
    campo.value = correo;
    campo.dispatchEvent(new Event('input'));
    elemento.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('lista los dueños y marca al propietario', () => {
    expect(elemento.querySelectorAll('li').length).toBe(2);
    expect(elemento.querySelectorAll('.etiqueta').length).toBe(1);
  });

  it('emite el correo escrito', () => {
    const emitidos: string[] = [];
    fixture.componentInstance.agregar.subscribe((c) => emitidos.push(c));
    escribirCorreo('andres.vargas@ejemplo.cr');
    expect(emitidos).toEqual(['andres.vargas@ejemplo.cr']);
  });

  it('no emite un correo inválido y muestra el error', () => {
    const emitidos: string[] = [];
    fixture.componentInstance.agregar.subscribe((c) => emitidos.push(c));
    escribirCorreo('no-es-correo');
    expect(emitidos).toEqual([]);
    expect(elemento.querySelector('.error')?.textContent).toContain('correo válido');
  });
});
