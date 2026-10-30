import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZonaPeligroComponent } from './zona-peligro.component';

describe('ZonaPeligroComponent', () => {
  let fixture: ComponentFixture<ZonaPeligroComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonaPeligroComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ZonaPeligroComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('muestra título, descripción y botón por defecto', () => {
    expect(pagina.querySelector('.zona-peligro__titulo')?.textContent).toBe('Zona de peligro');
    expect(pagina.querySelector('.zona-peligro__descripcion')?.textContent).toContain(
      'no se puede deshacer',
    );
    expect(pagina.querySelector('.zona-peligro__boton')?.textContent?.trim()).toBe('Eliminar');
  });

  it('emite eliminar al pulsar el botón', () => {
    const spy = jasmine.createSpy('eliminar');
    fixture.componentInstance.eliminar.subscribe(spy);

    pagina.querySelector<HTMLButtonElement>('.zona-peligro__boton')!.click();

    expect(spy).toHaveBeenCalled();
  });

  it('respeta inputs personalizados', () => {
    fixture.componentRef.setInput('titulo', 'Borrar finca');
    fixture.componentRef.setInput('descripcion', 'Se perderán los datos.');
    fixture.componentRef.setInput('etiquetaBoton', 'Eliminar finca');
    fixture.detectChanges();

    expect(pagina.querySelector('.zona-peligro__titulo')?.textContent).toBe('Borrar finca');
    expect(pagina.querySelector('.zona-peligro__descripcion')?.textContent).toBe(
      'Se perderán los datos.',
    );
    expect(pagina.querySelector('.zona-peligro__boton')?.textContent?.trim()).toBe(
      'Eliminar finca',
    );
  });
});
