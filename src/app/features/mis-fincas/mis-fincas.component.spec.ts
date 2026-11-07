import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { MisFincasComponent, RUTA_REGISTRAR_FINCA } from './mis-fincas.component';

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

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  it('muestra el menú lateral y el encabezado del prototipo', () => {
    expect(elemento.querySelector('app-menu-lateral')).toBeTruthy();
    expect(elemento.querySelector('h1')?.textContent).toContain('Mis fincas');
    expect(elemento.textContent).toContain(
      'Estas son las fincas que tenés registradas en Cránhua.',
    );
  });

  it('muestra una tarjeta por cada finca del usuario', () => {
    expect(elemento.querySelectorAll('app-tarjeta-finca').length).toBe(2);
  });

  it('enlaza cada finca a su detalle', () => {
    const enlaces = Array.from(
      elemento.querySelectorAll<HTMLAnchorElement>('app-tarjeta-finca a.tarjeta__accion'),
    ).map((a) => a.getAttribute('href'));
    expect(enlaces).toEqual([
      '/cafetalero/fincas/f-la-esperanza',
      '/cafetalero/fincas/f-el-mirador',
    ]);
  });

  it('tiene los botones para registrar una nueva finca', () => {
    const cta = elemento.querySelector<HTMLAnchorElement>('.cabecera .cta');
    const vacia = elemento.querySelector<HTMLAnchorElement>('a.nueva-finca');
    expect(cta?.getAttribute('href')).toBe(RUTA_REGISTRAR_FINCA);
    expect(vacia?.getAttribute('href')).toBe(RUTA_REGISTRAR_FINCA);
    expect(cta?.textContent).toContain('Registrar finca');
  });

  it('permite alternar entre tema oscuro y claro', () => {
    const root = elemento.querySelector('.mis-fincas')!;
    expect(root.getAttribute('data-theme')).toBe('oscuro');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(root.getAttribute('data-theme')).toBe('claro');
  });
});
