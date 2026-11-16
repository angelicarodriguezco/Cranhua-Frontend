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

  it('al hacer click en un pin abre el panel con query seleccionado', () => {
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);

    for (const punto of PUNTOS_MAPA_CONSUMIDOR) {
      navegar.calls.reset();
      componente['abrirPerfil'](punto);
      expect(navegar).toHaveBeenCalledWith([], {
        relativeTo: TestBed.inject(ActivatedRoute),
        queryParams: {
          seleccionado: punto.id,
          menu: null,
        },
        queryParamsHandling: 'merge',
      });
    }
  });

  it('con query seleccionado muestra el panel lateral sin CTA de perfil completo', () => {
    const punto = PUNTOS_MAPA_CONSUMIDOR[0];
    queryParams$.next(convertToParamMap({ seleccionado: punto.id }));
    fixture.detectChanges();

    const panel = pagina.querySelector('.panel-negocio');
    expect(panel).toBeTruthy();
    expect(panel!.textContent).toContain(punto.nombre);
    expect(pagina.querySelector('#panel-negocio-titulo')!.textContent).toContain(punto.nombre);
    expect(panel!.textContent).not.toContain('Ver perfil completo');
    expect(pagina.querySelector('.panel-negocio__portada')).toBeTruthy();
  });

  it('en cafetería muestra el menú colapsado y se abre con menu=1', () => {
    const cafeteria = PUNTOS_MAPA_CONSUMIDOR.find((p) => p.tipo === 'cafeteria')!;
    queryParams$.next(convertToParamMap({ seleccionado: cafeteria.id }));
    fixture.detectChanges();

    const toggle = pagina.querySelector<HTMLButtonElement>('.panel-menu__toggle');
    expect(toggle).toBeTruthy();
    expect(toggle!.textContent).toContain('Ver menú');
    expect(toggle!.getAttribute('aria-expanded')).toBe('false');
    expect(pagina.querySelector('#panel-menu-contenido')).toBeNull();

    queryParams$.next(convertToParamMap({ seleccionado: cafeteria.id, menu: '1' }));
    fixture.detectChanges();

    expect(pagina.querySelector('.panel-menu__toggle')!.textContent).toContain('Ocultar menú');
    expect(pagina.querySelector('#panel-menu-contenido')).toBeTruthy();
    expect(pagina.querySelector('.panel-menu__contenido')!.textContent).toContain('Cafés');
  });

  it('con código válido abre el panel de la finca con query cosecha', () => {
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);

    buscarCodigo('CRH-2026-0103');

    expect(pagina.querySelector('.barra-busqueda__error')).toBeNull();
    expect(navegar).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: {
        seleccionado: 'finca-el-roble',
        resaltar: 'finca-el-roble',
        cosecha: 'cosecha-catuai-el-roble',
        menu: null,
      },
      queryParamsHandling: 'merge',
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

  it('resaltar marca pines sin cambiar el zoom del mapa', () => {
    const [a, b] = PUNTOS_MAPA_CONSUMIDOR;
    const centroInicial = componente['centro']();
    const zoomInicial = componente['zoom']();
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
    expect(componente['centro']()).toEqual(centroInicial);
    expect(componente['zoom']()).toBe(zoomInicial);
  });

  it('seleccionar un pin no cambia el zoom del mapa y lo marca como seleccionado', () => {
    const punto = PUNTOS_MAPA_CONSUMIDOR[2];
    const centroInicial = componente['centro']();
    const zoomInicial = componente['zoom']();
    queryParams$.next(convertToParamMap({ seleccionado: punto.id }));
    fixture.detectChanges();

    expect(componente['idsResaltados']()).toEqual(new Set([punto.id]));
    expect(
      componente['contenidoPin'](punto).classList.contains('pin-consumidor--seleccionado'),
    ).toBeTrue();
    expect(
      componente['contenidoPin'](PUNTOS_MAPA_CONSUMIDOR[0]).classList.contains(
        'pin-consumidor--seleccionado',
      ),
    ).toBeFalse();
    expect(componente['centro']()).toEqual(centroInicial);
    expect(componente['zoom']()).toBe(zoomInicial);
  });
});
