import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CUENTA_SOLO_CAFETALERO } from '../../core/mocks/cuenta.mock';
import { CuentaService } from '../../core/services/cuenta.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { PaginaNoEncontradaComponent } from './pagina-no-encontrada.component';

describe('PaginaNoEncontradaComponent', () => {
  function crear() {
    const fixture = TestBed.createComponent(PaginaNoEncontradaComponent);
    fixture.detectChanges();
    return fixture;
  }

  function boton(fixture: ReturnType<typeof crear>): HTMLAnchorElement {
    return fixture.nativeElement.querySelector('.no-encontrada__boton');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PaginaNoEncontradaComponent],
      providers: [provideRouter([])],
    });
  });

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  it('sin sesión vuelve al inicio', () => {
    const fixture = crear();

    expect(boton(fixture).textContent).toContain('Volver al inicio');
    expect(boton(fixture).getAttribute('href')).toBe('/');
  });

  it('con sesión vuelve al dashboard del rol', () => {
    TestBed.inject(CuentaService).establecerCuenta(CUENTA_SOLO_CAFETALERO);
    const fixture = crear();

    expect(boton(fixture).textContent).toContain('Volver al dashboard');
    expect(boton(fixture).getAttribute('href')).toBe('/cafetalero/dashboard');
  });

  it('aplica el tema guardado', () => {
    TestBed.inject(TemaService).establecerTema('oscuro');
    const fixture = crear();

    expect(fixture.nativeElement.getAttribute('data-theme')).toBe('oscuro');
  });
});
