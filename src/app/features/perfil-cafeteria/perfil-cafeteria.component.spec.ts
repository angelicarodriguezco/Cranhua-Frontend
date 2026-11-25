import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { NEVER, of } from 'rxjs';

import { PerfilCafeteria } from '../../core/models/perfil-cafeteria.model';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { PerfilCafeteriaService } from '../../core/services/perfil-cafeteria.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { PerfilCafeteriaComponent } from './perfil-cafeteria.component';

const PERFIL_PRUEBA: PerfilCafeteria = {
  id: 'c-cafe-brumas',
  nombre: 'Café Brumas',
  ubicacion: 'Escazú, San José',
  descripcion:
    'Cafetería de especialidad que sirve café costarricense con origen conocido.',
  coordenada: { lat: 9.9205, lng: -84.137 },
  cafesTrazables: 3,
  tostadores: [{ id: 'n-tostaduria-volcan', nombre: 'Tostaduría Volcán', ubicacion: 'San José' }],
  horario: 'Lun a sáb, 7:00 a 19:00',
  miembroDesde: '2025-06-10',
  fincas: [
    { id: 'finca-la-catalina', nombre: 'Finca La Catalina', ubicacion: 'Tarrazú' },
    { id: 'finca-el-roble', nombre: 'Finca El Roble', ubicacion: 'Naranjo' },
  ],
};

describe('PerfilCafeteriaComponent', () => {
  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  function crear(id: string, perfil: PerfilCafeteria | null = PERFIL_PRUEBA): ComponentFixture<PerfilCafeteriaComponent> {
    TestBed.configureTestingModule({
      imports: [PerfilCafeteriaComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id }) },
            paramMap: of(convertToParamMap({ id })),
          },
        },
        {
          provide: PerfilCafeteriaService,
          useValue: {
            obtener: jasmine
              .createSpy('obtener')
              .and.callFake((pedidoId: string) =>
                of(pedidoId === PERFIL_PRUEBA.id ? perfil : null),
              ),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(PerfilCafeteriaComponent);
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

    it('muestra la etiqueta, iniciales, nombre, ubicación y descripción', () => {
      expect(pagina.querySelector('.pill-rol')?.textContent).toContain('Cafetería');
      expect(pagina.querySelector('.avatar')?.textContent?.trim()).toBe('CB');
      expect(pagina.querySelector('h1')?.textContent).toContain('Café Brumas');
      expect(pagina.querySelector('.ubicacion')?.textContent).toContain('Escazú');
      expect(pagina.querySelector('.descripcion')?.textContent?.trim()).not.toBe('');
    });

    it('muestra cafés trazables, tostadores, horario y fecha de ingreso', () => {
      const datos = pagina.querySelector('.datos')!.textContent!;
      expect(datos).toContain('Cafés con trazabilidad en el menú');
      expect(datos).toContain('Tostaduría Volcán');
      expect(datos).toContain('Lun a sáb');
      expect(datos).toContain('Junio 2025');
    });

    it('muestra el mapa con la ubicación', () => {
      expect(pagina.querySelector('.mapa')?.getAttribute('aria-label')).toBe(
        'Ubicación de la cafetería',
      );
    });

    it('lista al menos 2 fincas de origen que navegan a su perfil público', () => {
      const fincas = pagina.querySelectorAll<HTMLAnchorElement>('a[href^="/explorar/finca/"]');
      expect(fincas.length).toBeGreaterThanOrEqual(2);
      expect(fincas[0].getAttribute('href')).toBe('/explorar/finca/finca-la-catalina');
      expect(fincas[1].getAttribute('href')).toBe('/explorar/finca/finca-el-roble');
    });

    it('"Ver menú público" navega al menú de la cafetería', () => {
      expect(enlace(pagina, 'Ver menú público').getAttribute('href')).toBe(
        '/explorar/cafeteria/c-cafe-brumas/menu',
      );
    });

    it('"Volver al directorio" regresa al mapa de inicio', () => {
      expect(enlace(pagina, 'Volver al directorio').getAttribute('href')).toBe('/explorar');
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
    const pagina: HTMLElement = crear('no-existe', null).nativeElement;
    expect(pagina.textContent).toContain('No encontramos esta cafetería');
    expect(enlace(pagina, 'Volver al directorio').getAttribute('href')).toBe('/explorar');
  });
});
