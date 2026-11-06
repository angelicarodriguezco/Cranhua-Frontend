import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { formatearColones } from '../../shared/utils/formato';
import { MenuPublicoComponent } from './menu-publico.component';

describe('MenuPublicoComponent', () => {
  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  function crear(id: string): ComponentFixture<MenuPublicoComponent> {
    TestBed.configureTestingModule({
      imports: [MenuPublicoComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id }) },
            paramMap: of(convertToParamMap({ id })),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(MenuPublicoComponent);
    fixture.detectChanges();
    return fixture;
  }

  function enlace(pagina: HTMLElement, texto: string): HTMLAnchorElement {
    const encontrado = [...pagina.querySelectorAll('a')].find((a) =>
      a.textContent?.includes(texto),
    );
    if (!encontrado) {
      throw new Error(`No hay enlace "${texto}"`);
    }
    return encontrado;
  }

  describe('con una cafetería existente', () => {
    let pagina: HTMLElement;

    beforeEach(() => {
      pagina = crear('c-cafe-brumas').nativeElement;
    });

    it('muestra el nombre y la ubicación de la cafetería', () => {
      expect(pagina.querySelector('h1')?.textContent).toContain('Café Brumas');
      expect(pagina.querySelector('.ubicacion')?.textContent).toContain('Escazú');
    });

    it('muestra al menos 3 cafés con tueste, notas y precio', () => {
      const cafes = pagina.querySelectorAll('.fila--cafe');
      expect(cafes.length).toBeGreaterThanOrEqual(3);
      const primero = cafes[0].textContent!;
      expect(primero).toContain('Espresso Finca La Catalina');
      expect(primero).toContain('Tueste claro · Notas a caramelo y cítricos');
      expect(primero).toContain(formatearColones(1500));
    });

    it('muestra al menos 2 otras comidas con precio', () => {
      const comidas = pagina.querySelectorAll('[aria-labelledby="titulo-comidas"] .fila');
      expect(comidas.length).toBeGreaterThanOrEqual(2);
      expect(comidas[0].textContent).toContain('Croissant de almendra');
      expect(comidas[0].querySelector('.fila__precio')?.textContent).toContain(
        formatearColones(1200),
      );
    });

    it('"Ver origen" navega al perfil público de la finca', () => {
      const origenes = pagina.querySelectorAll<HTMLAnchorElement>('a.ver-origen');
      expect(origenes.length).toBe(3);
      expect(origenes[0].getAttribute('href')).toBe('/explorar/finca/finca-la-catalina');
      expect(origenes[2].getAttribute('href')).toBe('/explorar/finca/finca-el-roble');
    });

    it('"Volver a la cafetería" regresa al perfil público de la cafetería', () => {
       expect(enlace(pagina, 'Volver a la cafetería').getAttribute('href')).toBe(
        '/explorar/cafeteria/c-cafe-brumas',
      );
    });
  });

  it('cambia entre modo claro y oscuro', () => {
    const fixture = crear('c-cafe-brumas');
    const pagina: HTMLElement = fixture.nativeElement;

    TestBed.inject(TemaService).establecerTema('oscuro');
    fixture.detectChanges();
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
    expect(pagina.querySelector('.marca')?.getAttribute('src')).toBe('/images/logo-cranhua.png');

    const claro = [...pagina.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Claro'),
    )!;
    claro.click();
    fixture.detectChanges();
    expect(pagina.getAttribute('data-theme')).toBe('claro');
    expect(pagina.querySelector('.marca')?.getAttribute('src')).toBe(
      '/images/logo-cranhua-negro.png',
    );
  });

  it('muestra un aviso si la cafetería no existe', () => {
    const pagina: HTMLElement = crear('no-existe').nativeElement;
    expect(pagina.textContent).toContain('No encontramos este menú');
    expect(enlace(pagina, 'Volver al directorio').getAttribute('href')).toBe('/explorar');
  });
});
