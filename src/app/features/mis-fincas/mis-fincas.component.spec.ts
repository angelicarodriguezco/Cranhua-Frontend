import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MisFincasComponent } from './mis-fincas.component';

describe('MisFincasComponent', () => {
  let fixture: ComponentFixture<MisFincasComponent>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisFincasComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MisFincasComponent);
    fixture.detectChanges();
    elemento = fixture.nativeElement;
  });

  it('muestra una tarjeta por cada finca del usuario', () => {
    expect(elemento.querySelectorAll('app-tarjeta-finca').length).toBe(2);
  });

  it('enlaza cada finca a su detalle', () => {
    const enlaces = Array.from(elemento.querySelectorAll('app-tarjeta-finca a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(enlaces).toEqual([
      '/cafetalero/fincas/f-la-esperanza',
      '/cafetalero/fincas/f-el-mirador',
    ]);
  });

  it('tiene el boton para registrar una nueva finca', () => {
    const boton = elemento.querySelector('.mis-fincas__encabezado a');
    expect(boton?.getAttribute('href')).toBe('/onboarding-finca');
  });
});
