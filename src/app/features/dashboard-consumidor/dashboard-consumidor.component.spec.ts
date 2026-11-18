import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  ParamMap,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject, NEVER, of } from 'rxjs';

import { PuntoMapaConsumidor } from '../../core/models/punto-mapa-consumidor.model';
import { DashboardConsumidorService } from '../../core/services/dashboard-consumidor.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { DashboardConsumidorComponent } from './dashboard-consumidor.component';

const PUNTOS_PRUEBA: PuntoMapaConsumidor[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    tipo: 'finca',
    nombre: 'Finca La Catalina',
    ubicacionLabel: 'Tarrazú',
    coordenada: { lat: 9.6612, lng: -84.031 },
    rutaPerfil: '/explorar/finca/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  },
  {
    id: 'finca-el-roble',
    tipo: 'finca',
    nombre: 'Finca El Roble',
    ubicacionLabel: 'Naranjo',
    coordenada: { lat: 10.1025, lng: -84.3812 },
    rutaPerfil: '/explorar/finca/finca-el-roble',
  },
  {
    id: '11111111-2222-3333-4444-555555555555',
    tipo: 'tostador',
    nombre: 'Tostaduría Volcán',
    ubicacionLabel: 'San José',
    coordenada: { lat: 9.9335, lng: -84.0775 },
    rutaPerfil: '/explorar/tostador/11111111-2222-3333-4444-555555555555',
  },
  {
    id: 'c-cafe-brumas',
    tipo: 'cafeteria',
    nombre: 'Café Brumas',
    ubicacionLabel: 'Escazú',
    coordenada: { lat: 9.9205, lng: -84.137 },
    rutaPerfil: '/explorar/cafeteria/c-cafe-brumas',
  },
];

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
        provideHttpClient(),
        provideHttpClientTesting(),
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

    spyOn(TestBed.inject(DashboardConsumidorService), 'puntos').and.returnValue(of(PUNTOS_PRUEBA));

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

  it('usa los pines del servicio y muestra la leyenda con 3 tipos', () => {
    expect(componente['puntos']()).toEqual(PUNTOS_PRUEBA);
    expect(componente['puntos']().length).toBe(PUNTOS_PRUEBA.length);

    for (const punto of PUNTOS_PRUEBA) {
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

    for (const punto of PUNTOS_PRUEBA) {
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
    const punto = PUNTOS_PRUEBA[0];
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
    const cafeteria = PUNTOS_PRUEBA.find((p) => p.tipo === 'cafeteria')!;
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
    const [a, b] = PUNTOS_PRUEBA;
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
      componente['contenidoPin'](PUNTOS_PRUEBA[2]).classList.contains('pin-consumidor--resaltado'),
    ).toBeFalse();
    expect(componente['centro']()).toEqual(centroInicial);
    expect(componente['zoom']()).toBe(zoomInicial);
  });

  it('seleccionar un pin no cambia el zoom del mapa y lo marca como seleccionado', () => {
    const punto = PUNTOS_PRUEBA[2];
    const centroInicial = componente['centro']();
    const zoomInicial = componente['zoom']();
    queryParams$.next(convertToParamMap({ seleccionado: punto.id }));
    fixture.detectChanges();

    expect(componente['idsResaltados']()).toEqual(new Set([punto.id]));
    expect(
      componente['contenidoPin'](punto).classList.contains('pin-consumidor--seleccionado'),
    ).toBeTrue();
    expect(
      componente['contenidoPin'](PUNTOS_PRUEBA[0]).classList.contains(
        'pin-consumidor--seleccionado',
      ),
    ).toBeFalse();
    expect(componente['centro']()).toEqual(centroInicial);
    expect(componente['zoom']()).toBe(zoomInicial);
  });

  it('con query centrar mueve el mapa al pin y sube el zoom local', () => {
    const punto = PUNTOS_PRUEBA[0];
    queryParams$.next(convertToParamMap({ centrar: punto.id }));
    fixture.detectChanges();

    expect(componente['centro']()).toEqual(punto.coordenada);
    expect(componente['zoom']()).toBe(12);
  });

  it('con centrar desconocido mantiene la vista país', () => {
    const centroInicial = componente['centro']();
    const zoomInicial = componente['zoom']();
    queryParams$.next(convertToParamMap({ centrar: 'id-inexistente' }));
    fixture.detectChanges();

    expect(componente['centro']()).toEqual(centroInicial);
    expect(componente['zoom']()).toBe(zoomInicial);
  });
});
