import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { PERFIL_CAFETALERO_SIDEBAR } from '../../../../core/mocks/dashboard-cafetalero.mock';
import {
  MenuLateralCafetaleroComponent,
  NAV_PRINCIPAL_CAFETALERO,
  NAV_SECUNDARIO_CAFETALERO,
} from './menu-lateral-cafetalero.component';

describe('MenuLateralCafetaleroComponent', () => {
  let fixture: ComponentFixture<MenuLateralCafetaleroComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuLateralCafetaleroComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuLateralCafetaleroComponent);
    fixture.componentRef.setInput('perfil', PERFIL_CAFETALERO_SIDEBAR);
    fixture.componentRef.setInput('tema', 'oscuro');
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('muestra solo el logo de marca sin texto Cránhua', () => {
    const logo = pagina.querySelector<HTMLImageElement>('.logo');
    expect(logo).toBeTruthy();
    expect(logo?.getAttribute('alt')).toBe('Cránhua');
    expect(pagina.querySelector('.nombre-marca')).toBeNull();
    expect(pagina.textContent).not.toContain('Cránhua');
    expect(pagina.textContent).not.toContain('👋');
  });

  it('enlaza la navegación principal y secundaria a las rutas del plan', () => {
    const rutas = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .map((el) => el.injector.get(RouterLink).href ?? '');

    const esperadas = [...NAV_PRINCIPAL_CAFETALERO, ...NAV_SECUNDARIO_CAFETALERO].map(
      (item) => item.ruta,
    );
    expect(rutas).toEqual(esperadas);
  });

  it('muestra el perfil del cafetalero', () => {
    expect(pagina.textContent).toContain('RC');
    expect(pagina.textContent).toContain('Rodrigo Alvarado');
    expect(pagina.textContent).toContain('Cafetalero');
  });

  it('emite alternarTema al pulsar el toggle', () => {
    const spy = jasmine.createSpy('alternarTema');
    fixture.componentInstance.alternarTema.subscribe(spy);

    const toggle = pagina.querySelector<HTMLButtonElement>('.toggle-tema')!;
    expect(toggle.getAttribute('aria-label')).toBe('Cambiar a tema claro');
    toggle.click();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
