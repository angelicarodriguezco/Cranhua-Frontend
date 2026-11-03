import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { PERFIL_CAFETERIA_SIDEBAR } from '../../../../core/mocks/dashboard-cafeteria.mock';
import {
  MenuLateralCafeteriaComponent,
  NAV_PRINCIPAL_CAFETERIA,
  NAV_SECUNDARIO_CAFETERIA,
} from './menu-lateral-cafeteria.component';

describe('MenuLateralCafeteriaComponent', () => {
  let fixture: ComponentFixture<MenuLateralCafeteriaComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuLateralCafeteriaComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuLateralCafeteriaComponent);
    fixture.componentRef.setInput('perfil', PERFIL_CAFETERIA_SIDEBAR);
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
  });

  it('enlaza la navegación principal y secundaria a las rutas del plan', () => {
    const rutas = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .map((el) => el.injector.get(RouterLink).href ?? '');

    const esperadas = [...NAV_PRINCIPAL_CAFETERIA, ...NAV_SECUNDARIO_CAFETERIA].map(
      (item) => item.ruta,
    );
    expect(rutas).toEqual(esperadas);
  });

  it('muestra las etiquetas de navegación del plan', () => {
    const texto = pagina.textContent ?? '';
    expect(texto).toContain('Dashboard');
    expect(texto).toContain('Explorar tostadores');
    expect(texto).toContain('Mis pedidos');
    expect(texto).toContain('Mi cafetería');
    expect(texto).toContain('Perfil y ajustes');
    expect(texto).toContain('Cerrar sesión');
  });

  it('muestra el perfil de la cafetería', () => {
    expect(pagina.textContent).toContain('AS');
    expect(pagina.textContent).toContain('Andrés Solano');
    expect(pagina.textContent).toContain('Cafetería - Café Brumas');
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
