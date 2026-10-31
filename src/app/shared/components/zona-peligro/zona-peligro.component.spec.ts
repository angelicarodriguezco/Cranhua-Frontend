import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZonaPeligroComponent } from './zona-peligro.component';

describe('ZonaPeligroComponent', () => {
  let fixture: ComponentFixture<ZonaPeligroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonaPeligroComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ZonaPeligroComponent);
    fixture.componentRef.setInput('descripcion', 'No se puede deshacer.');
    fixture.componentRef.setInput('accion', 'Eliminar finca');
    fixture.detectChanges();
  });

  it('muestra el botón de la acción y lo emite al hacer clic', () => {
    let confirmado = false;
    fixture.componentInstance.confirmar.subscribe(() => (confirmado = true));

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(boton.textContent).toContain('Eliminar finca');
    boton.click();
    expect(confirmado).toBeTrue();
  });
});
