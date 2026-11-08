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
    fixture.componentRef.setInput('usuarioId', USUARIOS[1].id);
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

  it('marca con "Vos" solo al dueño que es el usuario actual', () => {
    const filas = elemento.querySelectorAll('li');
    expect(filas.length).toBe(2);
    expect(filas[0].querySelector('.etiqueta')).toBeNull();
    expect(filas[1].querySelector('.etiqueta')?.textContent).toBe('Vos');
  });

  it('muestra solo iniciales y nombre de cada dueño, sin correo', () => {
    const filas = [...elemento.querySelectorAll('li')];
    expect(filas.map((f) => f.querySelector('.avatar')?.textContent)).toEqual(['RS', 'MJ']);
    expect(filas.map((f) => f.querySelector('.nombre')?.textContent)).toEqual([
      'Rodrigo Solís Ureña',
      'María Jiménez Solano',
    ]);
    expect(elemento.querySelector('ul')?.textContent).not.toContain('@');
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
