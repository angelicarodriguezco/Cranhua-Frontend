import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import {
  CUENTA_CAFETALERO_TOSTADOR,
  CUENTA_SOLO_CAFETALERO,
  CUENTA_TRES_ROLES,
} from '../../../core/mocks/cuenta.mock';
import { CAFETERIA_EJEMPLO } from '../../../core/mocks/cafeteria.mock';
import { Cuenta } from '../../../core/models/cuenta.model';
import { CafeteriaService } from '../../../core/services/cafeteria.service';
import { CuentaService } from '../../../core/services/cuenta.service';
import { CLAVE_TEMA, TemaService } from '../../../core/services/tema.service';
import { MenuLateralComponent } from './menu-lateral.component';
import { NAV_POR_ROL, rutaActiva } from './menu-lateral.config';

@Component({ template: '' })
class VistaVaciaComponent {}

describe('MenuLateralComponent', () => {
  let fixture: ComponentFixture<MenuLateralComponent>;
  let pagina: HTMLElement;

  async function crear(cuenta: Cuenta, conCafeteria = true): Promise<void> {
    localStorage.removeItem(CLAVE_TEMA);
    await TestBed.configureTestingModule({
      imports: [MenuLateralComponent],
      providers: [
        provideRouter([{ path: '**', component: VistaVaciaComponent }]),
        {
          provide: CafeteriaService,
          useValue: { obtenerActual: () => of(conCafeteria ? CAFETERIA_EJEMPLO : undefined) },
        },
      ],
    }).compileComponents();

    TestBed.inject(CuentaService).establecerCuenta(cuenta);
    fixture = TestBed.createComponent(MenuLateralComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  }

  async function navegar(url: string): Promise<void> {
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
  }

  const titulos = () =>
    [...pagina.querySelectorAll('.titulo-rol')].map((h) => h.textContent?.trim());
  const rutasDe = (selector: string) =>
    [...pagina.querySelectorAll<HTMLAnchorElement>(selector)].map((a) => a.getAttribute('href'));
  const activos = () => [...pagina.querySelectorAll('a.activo')].map((a) => a.textContent?.trim());

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  it('con un solo rol muestra solo sus secciones y sin encabezado de rol', async () => {
    await crear(CUENTA_SOLO_CAFETALERO);

    expect(titulos()).toEqual([]);
    expect(pagina.querySelectorAll('.bloque-rol').length).toBe(1);
    expect(rutasDe('.nav-rol a')).toEqual(NAV_POR_ROL.cafetalero.map((item) => item.ruta));
    expect(pagina.querySelector('.perfil-rol')?.textContent?.trim()).toBe('Cafetalero');
  });

  it('con dos roles muestra ambos bloques con su encabezado', async () => {
    await crear(CUENTA_CAFETALERO_TOSTADOR);

    expect(titulos()).toEqual(['Cafetalero', 'Tostador']);
    expect(rutasDe('[data-rol="tostador"] a')).toEqual(
      NAV_POR_ROL.tostador.map((item) => item.ruta),
    );
  });

  it('con tres roles muestra los tres bloques y la cuenta una sola vez al final', async () => {
    await crear(CUENTA_TRES_ROLES);

    expect(titulos()).toEqual(['Cafetalero', 'Tostador', 'Cafetería']);
    const todas = rutasDe('aside a');
    expect(todas.filter((ruta) => ruta === '/perfil').length).toBe(1);
    expect(todas.filter((ruta) => ruta === '/iniciar-sesion').length).toBe(1);
    expect(todas.slice(-2)).toEqual(['/perfil', '/iniciar-sesion']);
    expect(pagina.querySelector('.perfil-rol')?.textContent?.trim()).toBe(
      'Cafetalero · Tostador · Cafetería',
    );
    expect(pagina.querySelector('.avatar')?.textContent?.trim()).toBe('RA');
  });

  it('cada sección enlaza a su vista sin importar el rol', async () => {
    await crear(CUENTA_TRES_ROLES);
    await navegar('/cafetalero/dashboard');

    expect(rutasDe('[data-rol="cafeteria"] a')).toEqual(
      NAV_POR_ROL.cafeteria.map((item) => item.ruta),
    );
    pagina.querySelector<HTMLAnchorElement>('a[href="/tostador/tostados"]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/tostador/tostados');
    expect(activos()).toEqual(['Mis tostados']);
  });

  it('resalta una sola sección activa en todo el menú', async () => {
    await crear(CUENTA_TRES_ROLES);

    await navegar('/tostador/dashboard');
    expect(activos()).toEqual(['Dashboard']);
    expect(pagina.querySelector('[data-rol="tostador"] a.activo')).toBeTruthy();

    await navegar('/cafetalero/fincas/finca-la-catalina');
    expect(activos()).toEqual(['Mis fincas']);

    await navegar('/cafeteria/menu');
    expect(activos()).toEqual(['Mi cafetería']);

    await navegar('/perfil');
    expect(activos()).toEqual(['Perfil y ajustes']);
    expect(pagina.querySelector('a.activo')?.getAttribute('aria-current')).toBe('page');
  });

  it('sin cafetería activa reduce solo el bloque de Cafetería a "Registrar cafetería"', async () => {
    await crear(CUENTA_TRES_ROLES, false);

    expect(rutasDe('[data-rol="cafeteria"] a')).toEqual(['/cafeteria/registrar']);
    expect(rutasDe('[data-rol="cafetalero"] a')).toEqual(
      NAV_POR_ROL.cafetalero.map((item) => item.ruta),
    );
    expect(rutasDe('[data-rol="tostador"] a')).toEqual(
      NAV_POR_ROL.tostador.map((item) => item.ruta),
    );
  });

  it('sigue el tema global (modo oscuro por defecto)', async () => {
    await crear(CUENTA_SOLO_CAFETALERO);
    const aside = pagina.querySelector('aside')!;
    expect(aside.getAttribute('data-tema')).toBe('oscuro');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(aside.getAttribute('data-tema')).toBe('claro');
  });
});

describe('rutaActiva', () => {
  const items = [...NAV_POR_ROL.tostador, ...NAV_POR_ROL.cafeteria];

  it('los dashboards solo se activan con la ruta exacta', () => {
    expect(rutaActiva('/tostador/dashboard', items)).toBe('/tostador/dashboard');
    expect(rutaActiva('/tostador/dashboard/otra', items)).toBeNull();
  });

  it('ignora query params y fragmentos', () => {
    expect(rutaActiva('/tostador/cosechas?variedad=geisha#top', items)).toBe('/tostador/cosechas');
  });

  it('no confunde rutas con el mismo prefijo de texto', () => {
    expect(rutaActiva('/tostador/cosechas-viejas', items)).toBeNull();
  });
});
