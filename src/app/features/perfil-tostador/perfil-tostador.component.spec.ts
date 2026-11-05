import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { NEVER, of } from 'rxjs';

import { DashboardConsumidorService } from '../../core/services/dashboard-consumidor.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { PerfilTostadorComponent } from './perfil-tostador.component';

describe('PerfilTostadorComponent', () => {
  function crear(id: string): ComponentFixture<PerfilTostadorComponent> {
    TestBed.configureTestingModule({
      imports: [PerfilTostadorComponent],
      providers: [
        provideRouter([]),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id }) },
            paramMap: of(convertToParamMap({ id })),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(PerfilTostadorComponent);
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

  describe('con un tostador existente', () => {
    let pagina: HTMLElement;

    beforeEach(() => {
      pagina = crear('n-tostaduria-volcan').nativeElement;
    });

    it('muestra la etiqueta, iniciales, nombre, ubicación y datos', () => {
      expect(pagina.querySelector('.pill-rol')?.textContent).toContain('Tostador');
      expect(pagina.querySelector('.avatar')?.textContent?.trim()).toBe('TV');
      expect(pagina.querySelector('h1')?.textContent).toContain('Tostaduría Volcán');
      expect(pagina.querySelector('.ubicacion')?.textContent).toContain('San José');

      const datos = pagina.querySelector('.datos')!.textContent!;
      expect(datos).toContain('Fincas con las que trabaja');
      expect(datos).toContain('Claro y medio');
      expect(datos).toContain('kg');
      expect(datos).toContain('Marzo 2025');
    });

    it('lista al menos 2 fincas que navegan a su perfil público', () => {
      const fincas = pagina.querySelectorAll<HTMLAnchorElement>('a[href^="/explorar/finca/"]');
      expect(fincas.length).toBeGreaterThanOrEqual(2);
      expect(fincas[0].getAttribute('href')).toBe('/explorar/finca/finca-la-catalina');
    });

    it('lista al menos 1 punto de venta que navega al perfil de la cafetería', () => {
      const ventas = pagina.querySelectorAll<HTMLAnchorElement>('a[href^="/explorar/cafeteria/"]');
      expect(ventas.length).toBeGreaterThanOrEqual(1);
      expect(ventas[0].getAttribute('href')).toBe('/explorar/cafeteria/c-cafe-brumas');
    });

    it('"Volver al directorio" regresa al mapa de inicio', () => {
      expect(enlace(pagina, 'Volver al directorio').getAttribute('href')).toBe('/explorar');
    });

    it('"Ver fincas con las que trabaja" abre el mapa con esas fincas resaltadas', () => {
      const href = enlace(pagina, 'Ver fincas con las que trabaja').getAttribute('href')!;
      const url = new URL(href, 'http://localhost');
      expect(url.pathname).toBe('/explorar');
      expect(url.searchParams.get('resaltar')).toBe('finca-la-catalina,finca-el-roble');
    });
  });

  it('cambia entre modo claro y oscuro', () => {
    const fixture = crear('n-tostaduria-volcan');
    const pagina: HTMLElement = fixture.nativeElement;
    const tema = TestBed.inject(DashboardConsumidorService);

    tema.establecerTema('oscuro');
    fixture.detectChanges();
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');

    const claro = [...pagina.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Claro'),
    )!;
    claro.click();
    fixture.detectChanges();
    expect(pagina.getAttribute('data-theme')).toBe('claro');
  });

  it('muestra un aviso si el tostador no existe', () => {
    const pagina: HTMLElement = crear('no-existe').nativeElement;
    expect(pagina.textContent).toContain('No encontramos este tostador');
    expect(enlace(pagina, 'Volver al directorio').getAttribute('href')).toBe('/explorar');
  });
});
