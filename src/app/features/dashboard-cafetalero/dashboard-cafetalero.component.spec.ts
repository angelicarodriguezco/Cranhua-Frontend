import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { SesionService } from '../../core/services/sesion.service';
import { USUARIOS } from '../../core/mocks/finca.mock';
import { DashboardCafetaleroComponent } from './dashboard-cafetalero.component';

describe('DashboardCafetaleroComponent', () => {
  let fixture: ComponentFixture<DashboardCafetaleroComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCafetaleroComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCafetaleroComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  function boton(texto: string): HTMLButtonElement {
    const encontrado = [...pagina.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(texto),
    );
    if (!encontrado) {
      throw new Error(`No hay botón "${texto}"`);
    }
    return encontrado;
  }

  function rutasDe(enlaceSelector: string): string[] {
    return fixture.debugElement
      .queryAll(By.css(enlaceSelector))
      .map((el) => el.injector.get(RouterLink).href ?? '');
  }

  it('saluda con el nombre de la sesión sin emoji', () => {
    expect(pagina.textContent).toContain('Hola, Rodrigo');
    expect(pagina.textContent).not.toContain('👋');
  });

  it('usa el nombre de quien haya iniciado sesión', () => {
    TestBed.inject(SesionService).iniciarSesion(USUARIOS[3]);
    fixture.detectChanges();
    expect(pagina.querySelector('h1')?.textContent?.trim()).toBe('Hola, Lucía');
  });

  it('muestra los 4 indicadores con datos de ejemplo', () => {
    const indicadores = pagina.querySelector('.indicadores');
    expect(indicadores).toBeTruthy();

    const articulos = indicadores!.querySelectorAll('article');
    expect(articulos).toHaveSize(4);
    expect(indicadores!.textContent).toContain('2');
    expect(indicadores!.textContent).toContain('Fincas registradas');
    expect(indicadores!.textContent).toContain('3');
    expect(indicadores!.textContent).toContain('Cosechas activas');
    expect(indicadores!.textContent).toContain('146 kg');
    expect(indicadores!.textContent).toContain('Disponible para tostadores');
    expect(indicadores!.textContent).toContain('Solicitudes pendientes');
  });

  it('lista al menos 2 solicitudes con Aprobar y Rechazar', () => {
    const seccion = pagina.querySelector('.solicitudes');
    expect(seccion).toBeTruthy();
    expect(seccion!.textContent).toContain('Tostaduría Volcán');
    expect(seccion!.textContent).toContain('40 kg');
    expect(seccion!.textContent).toContain('Café Altamira');
    expect(seccion!.textContent).toContain('Monte Alto');
    expect(seccion!.textContent).toContain('2 pendientes');

    const items = seccion!.querySelectorAll('ul > li');
    expect(items.length).toBeGreaterThanOrEqual(2);

    for (const item of Array.from(items)) {
      expect(item.textContent).toContain('Aprobar');
      expect(item.textContent).toContain('Rechazar');
    }
  });

  it('aprueba una solicitud desde la vista', () => {
    boton('Aprobar').click();
    fixture.detectChanges();

    expect(pagina.textContent).toContain('1 pendientes');
    expect(pagina.textContent).toContain('106 kg');
  });

  it('rechaza una solicitud sin cambiar kg disponibles', () => {
    boton('Rechazar').click();
    fixture.detectChanges();

    expect(pagina.textContent).toContain('1 pendientes');
    expect(pagina.textContent).toContain('146 kg');
    expect(pagina.querySelector('.solicitudes')!.textContent).toContain('Café Altamira');
  });

  it('muestra al menos 2 fincas y la opción de registrar una nueva', () => {
    const seccion = pagina.querySelector('.fincas');
    expect(seccion).toBeTruthy();
    expect(seccion!.textContent).toContain('Finca La Catalina');
    expect(seccion!.textContent).toContain('Tarrazú');
    expect(seccion!.textContent).toContain('Finca Monte Alto');
    expect(seccion!.textContent).toContain('Dota');
    expect(seccion!.textContent).toContain('2 cosechas');
    expect(seccion!.textContent).toContain('1 cosecha');
    expect(seccion!.querySelector('.nueva-finca')?.textContent).toContain('Registrar nueva finca');
  });

  it('muestra la tabla de cosechas recientes con al menos 3 filas', () => {
    const seccion = pagina.querySelector('.cosechas');
    expect(seccion).toBeTruthy();

    const filas = seccion!.querySelectorAll('tbody tr');
    expect(filas.length).toBeGreaterThanOrEqual(3);

    expect(seccion!.textContent).toContain('Caturra');
    expect(seccion!.textContent).toContain('Honey');
    expect(seccion!.textContent).toContain('96 kg');
    expect(seccion!.textContent).toContain('Geisha');
    expect(seccion!.textContent).toContain('Monte Alto');
    expect(seccion!.textContent).toContain('50 kg');
    expect(seccion!.textContent).toContain('Catuaí');
    expect(seccion!.textContent).toContain('Natural');
    expect(seccion!.textContent).toContain('—');
    expect(seccion!.textContent).toContain('Disponible');
    expect(seccion!.textContent).toContain('En beneficiado');
  });

  it('enlaza CTA, fincas, historial y menú a las rutas del plan', () => {
    expect(rutasDe('.cta')).toEqual(['/registrar-cosecha']);
    expect(rutasDe('.fincas .seccion-cabecera a')).toEqual(['/mis-fincas']);
    expect(rutasDe('.nueva-finca')).toEqual(['/onboarding-finca']);
    expect(rutasDe('.cosechas .seccion-cabecera a')).toEqual(['/historial']);

    const detalles = rutasDe('.fincas-grid article a');
    expect(detalles).toContain('/fincas/finca-la-catalina');
    expect(detalles).toContain('/fincas/finca-monte-alto');

    const nav = rutasDe('app-menu-lateral-cafetalero a');
    expect(nav).toEqual(
      jasmine.arrayContaining([
        '/dashboard',
        '/mis-fincas',
        '/registrar-cosecha',
        '/historial',
        '/perfil',
        '/iniciar-sesion',
      ]),
    );
  });

  it('muestra el perfil del sidebar y permite alternar el tema', () => {
    expect(pagina.textContent).toContain('Rodrigo Alvarado');
    expect(pagina.textContent).toContain('RC');
    expect(pagina.querySelector('.dashboard')?.getAttribute('data-theme')).toBe('oscuro');

    boton('Tema claro').click();
    fixture.detectChanges();

    expect(pagina.querySelector('.dashboard')?.getAttribute('data-theme')).toBe('claro');
  });
});
