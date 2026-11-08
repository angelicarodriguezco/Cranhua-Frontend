import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { ExplorarTostadoresComponent } from './explorar-tostadores.component';

describe('ExplorarTostadoresComponent', () => {
  let fixture: ComponentFixture<ExplorarTostadoresComponent>;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExplorarTostadoresComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ExplorarTostadoresComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  function chip(texto: string): HTMLButtonElement {
    const encontrado = [...pagina.querySelectorAll<HTMLButtonElement>('.filtros button')].find(
      (b) => b.textContent?.trim() === texto,
    );
    if (!encontrado) {
      throw new Error(`No hay filtro "${texto}"`);
    }
    return encontrado;
  }

  function clic(elemento: HTMLElement): void {
    elemento.click();
    fixture.detectChanges();
  }

  function nombresVisibles(): string[] {
    return [...pagina.querySelectorAll('.tarjeta h3')].map((h) => h.textContent!.trim());
  }

  function rutasDe(selector: string): string[] {
    return fixture.debugElement
      .queryAll(By.css(selector))
      .map((el) => el.injector.get(RouterLink).href ?? '');
  }

  it('muestra al menos 6 tostadores sin filtros', () => {
    expect(pagina.querySelector('h1')?.textContent?.trim()).toBe('Explorar tostadores');
    expect(nombresVisibles().length).toBeGreaterThanOrEqual(6);
    expect(chip('Todos').getAttribute('aria-pressed')).toBe('true');
  });

  it('los filtros cambian los tostadores mostrados', () => {
    const todos = nombresVisibles().length;

    clic(chip('Oscuro'));
    expect(nombresVisibles()).toEqual([
      'Cerro Azul Roast',
      'Fuego Lento',
      'Grano Vivo',
      'Origen Puro',
    ]);
    expect(chip('Todos').getAttribute('aria-pressed')).toBe('false');
    expect(chip('Oscuro').getAttribute('aria-pressed')).toBe('true');

    clic(chip('Con café disponible'));
    expect(nombresVisibles()).toEqual([
      'Cerro Azul Roast',
      'Fuego Lento',
      'Grano Vivo',
      'Origen Puro',
    ]);

    clic(chip('Medio'));
    expect(nombresVisibles()).toEqual(['Tostaduría Volcán', 'Cerro Azul Roast', 'Grano Vivo']);
    expect(nombresVisibles()).not.toContain('Brisas del Sur');

    clic(chip('Todos'));
    expect(nombresVisibles()).toHaveSize(todos);
    expect(nombresVisibles()).toContain('Brisas del Sur');
  });

  it('"Con café disponible" deja fuera a los sin kg', () => {
    expect(nombresVisibles()).toContain('Brisas del Sur');
    clic(chip('Con café disponible'));
    expect(nombresVisibles()).not.toContain('Brisas del Sur');
    expect(nombresVisibles().length).toBe(6);
  });

  it('"Ver tostador" lleva al detalle del tostador', () => {
    const rutas = rutasDe('.tarjeta a');
    expect(rutas).toContain('/cafeteria/tostadores/tostador-volcan');
    expect([...pagina.querySelectorAll('.tarjeta a')].map((a) => a.textContent!.trim())).toContain(
      'Ver tostador',
    );
  });

  it('enlaza el menú a los destinos de cafetería', () => {
    expect(rutasDe('app-menu-lateral a')).toEqual(
      jasmine.arrayContaining([
        '/cafeteria/dashboard',
        '/cafeteria/tostadores',
        '/cafeteria/pedidos',
        '/cafeteria/mi-cafeteria',
        '/perfil',
        '/iniciar-sesion',
      ]),
    );
  });

  it('arranca en tema oscuro y alterna a claro en el host', () => {
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(pagina.getAttribute('data-theme')).toBe('claro');
  });
});
