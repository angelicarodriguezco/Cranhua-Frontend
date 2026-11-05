import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  ParamMap,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject, NEVER } from 'rxjs';

import { PUNTOS_MAPA_CONSUMIDOR } from '../../core/mocks/dashboard-consumidor.mock';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { DashboardConsumidorComponent } from './dashboard-consumidor.component';

describe('DashboardConsumidorComponent', () => {
  let fixture: ComponentFixture<DashboardConsumidorComponent>;
  let componente: DashboardConsumidorComponent;
  let pagina: HTMLElement;
  let queryParams$: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [DashboardConsumidorComponent],
      providers: [
        provideRouter([]),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({}) },
            queryParamMap: queryParams$.asObservable(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardConsumidorComponent);
    componente = fixture.componentInstance;
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

  function buscarCodigo(codigo: string): void {
    componente['codigo'].setValue(codigo);
    componente['buscar']();
    fixture.detectChanges();
  }

  it('muestra un enlace para volver al inicio', () => {
    const enlace = pagina.querySelector<HTMLAnchorElement>('a.volver-inicio');
    expect(enlace).toBeTruthy();
    expect(enlace!.getAttribute('href')).toBe('/');
    expect(enlace!.textContent).toContain('Volver al inicio');
  });

  it('expone al menos 4 pines y muestra la leyenda con 3 tipos', () => {
    expect(componente['puntos'].length).toBeGreaterThanOrEqual(4);
    expect(componente['puntos']).toEqual(PUNTOS_MAPA_CONSUMIDOR);

    for (const punto of PUNTOS_MAPA_CONSUMIDOR) {
      const pin = componente['contenidoPin'](punto);
      expect(pin.classList.contains(`pin-consumidor--${punto.tipo}`)).toBeTrue();
      expect(pin.textContent).toContain(punto.nombre);
      expect(pin.textContent).toContain(punto.ubicacionLabel);
    }

    const items = [...pagina.querySelectorAll('.leyenda__item')].map((li) =>
      li.textContent!.trim(),
    );
    expect(items).toEqual(['Fincas', 'Tostadores', 'Cafeterías']);
  });

  it('al hacer click en un pin navega a la ruta stub del perfil', () => {
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    for (const punto of PUNTOS_MAPA_CONSUMIDOR) {
      navegar.calls.reset();
      componente['abrirPerfil'](punto);
      expect(navegar).toHaveBeenCalledWith(punto.rutaPerfil);
    }
  });

  it('con código válido navega a la finca con query cosecha', () => {
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);

    buscarCodigo('CRH-2026-0103');

    expect(pagina.querySelector('.barra-busqueda__error')).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/explorar/finca', 'finca-el-roble'], {
      queryParams: { cosecha: 'cosecha-catuai-el-roble' },
    });
  });

  it('con código inválido muestra el mensaje de error', () => {
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);

    buscarCodigo('CODIGO-FALSO');

    expect(navegar).not.toHaveBeenCalled();
    const error = pagina.querySelector('.barra-busqueda__error');
    expect(error).toBeTruthy();
    expect(error!.textContent).toContain('No encontramos ese código');
    expect(error!.textContent).toContain('CRH-2026-0103');
  });

  it('el toggle cambia data-theme en el host', () => {
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
    expect(
      pagina.querySelector<HTMLImageElement>('.barra-busqueda__marca')?.getAttribute('src'),
    ).toBe('/images/logo-cranhua.png');

    boton('Claro').click();
    fixture.detectChanges();
    expect(pagina.getAttribute('data-theme')).toBe('claro');
    expect(
      pagina.querySelector<HTMLImageElement>('.barra-busqueda__marca')?.getAttribute('src'),
    ).toBe('/images/logo-cranhua-negro.png');

    boton('Oscuro').click();
    fixture.detectChanges();
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
  });

  it('centrar ajusta centro y zoom al pin indicado', () => {
    const punto = PUNTOS_MAPA_CONSUMIDOR[0];
    queryParams$.next(convertToParamMap({ centrar: punto.id }));
    fixture.detectChanges();

    expect(componente['centro']()).toEqual(punto.coordenada);
    expect(componente['zoom']()).toBe(14);
  });

  it('resaltar marca pines y centra cuando no hay centrar', () => {
    const [a, b] = PUNTOS_MAPA_CONSUMIDOR;
    queryParams$.next(convertToParamMap({ resaltar: `${a.id},${b.id}` }));
    fixture.detectChanges();

    expect(componente['idsResaltados']()).toEqual(new Set([a.id, b.id]));
    expect(
      componente['contenidoPin'](a).classList.contains('pin-consumidor--resaltado'),
    ).toBeTrue();
    expect(
      componente['contenidoPin'](b).classList.contains('pin-consumidor--resaltado'),
    ).toBeTrue();
    expect(
      componente['contenidoPin'](PUNTOS_MAPA_CONSUMIDOR[2]).classList.contains(
        'pin-consumidor--resaltado',
      ),
    ).toBeFalse();

    expect(componente['centro']()).toEqual({
      lat: (a.coordenada.lat + b.coordenada.lat) / 2,
      lng: (a.coordenada.lng + b.coordenada.lng) / 2,
    });
    expect(componente['zoom']()).toBe(9);
  });

  it('resaltar un solo pin centra y hace zoom como centrar', () => {
    const punto = PUNTOS_MAPA_CONSUMIDOR[2];
    queryParams$.next(convertToParamMap({ resaltar: punto.id }));
    fixture.detectChanges();

    expect(componente['idsResaltados']()).toEqual(new Set([punto.id]));
    expect(componente['centro']()).toEqual(punto.coordenada);
    expect(componente['zoom']()).toBe(14);
  });
});
