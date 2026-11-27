import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  ActivatedRoute,
  ParamMap,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { BehaviorSubject, NEVER, Subject, of, throwError } from 'rxjs';

import { MenuPublico } from '../../core/models/menu-publico.model';
import { PerfilCafeteria } from '../../core/models/perfil-cafeteria.model';
import { PerfilFincaPublico } from '../../core/models/perfil-finca-publico.model';
import { PerfilTostador } from '../../core/models/perfil-tostador.model';
import { PuntoMapaConsumidor } from '../../core/models/punto-mapa-consumidor.model';
import { DashboardConsumidorService } from '../../core/services/dashboard-consumidor.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { MenuPublicoService } from '../../core/services/menu-publico.service';
import { PerfilCafeteriaService } from '../../core/services/perfil-cafeteria.service';
import { PerfilFincaPublicoService } from '../../core/services/perfil-finca-publico.service';
import { PerfilTostadorService } from '../../core/services/perfil-tostador.service';
import { DashboardConsumidorComponent } from './dashboard-consumidor.component';

const PERFIL_FINCA_PRUEBA: PerfilFincaPublico = {
  id: 'finca-la-catalina',
  nombre: 'Finca La Catalina',
  ubicacion: 'Tarrazú, San José',
  descripcion: 'Café de altura.',
  zona: 'Tarrazú',
  propietarios: ['Ana Mora'],
  variedades: ['Caturra', 'Geisha'],
  procesos: ['Honey'],
  enCranhuaDesde: '2025-03-01',
  cosechasActivas: [
    {
      id: 'cosecha-1',
      codigo: 'CRH-2026-0001',
      variedad: 'Caturra',
      proceso: 'Honey',
      alturaMsnm: 1650,
      kgDisponibles: 120,
    },
  ],
  cafeterias: [{ id: 'c-cafe-brumas', nombre: 'Café Brumas', ubicacion: 'Escazú, San José' }],
};

const PERFIL_TOSTADOR_PRUEBA: PerfilTostador = {
  id: 'n-tostaduria-volcan',
  nombre: 'Tostaduría Volcán',
  ubicacion: 'San José',
  descripcion: 'Tueste en lotes pequeños.',
  estilos: ['Claro', 'Medio'],
  portadaUrl: null,
  miembroDesde: '2025-08-20',
  fincas: [
    { id: 'finca-la-catalina', nombre: 'Finca La Catalina', ubicacion: 'Tarrazú' },
    { id: 'finca-el-roble', nombre: 'Finca El Roble', ubicacion: 'Naranjo' },
  ],
  puntosVenta: [{ id: 'c-cafe-brumas', nombre: 'Café Brumas', ubicacion: 'Escazú' }],
};

const PERFIL_CAFETERIA_PRUEBA: PerfilCafeteria = {
  id: 'c-cafe-brumas',
  nombre: 'Café Brumas',
  ubicacion: 'Escazú, San José',
  descripcion: 'Cafetería de especialidad.',
  coordenada: { lat: 9.9205, lng: -84.137 },
  cafesTrazables: 2,
  tostadores: [{ id: 'n-tostaduria-volcan', nombre: 'Tostaduría Volcán', ubicacion: 'San José' }],
  horario: 'Lun a sáb, 7:00 a 19:00',
  miembroDesde: '2025-06-10',
  fincas: [
    { id: 'finca-la-catalina', nombre: 'Finca La Catalina', ubicacion: 'Tarrazú' },
    { id: 'finca-el-roble', nombre: 'Finca El Roble', ubicacion: 'Naranjo' },
  ],
};

const MENU_CAFETERIA_PRUEBA: MenuPublico = {
  cafeteriaId: 'c-cafe-brumas',
  nombre: 'Café Brumas',
  ubicacion: 'Escazú, San José',
  cafes: [
    {
      id: 'Espresso-1500-0',
      nombre: 'Espresso Finca La Catalina',
      nivelTueste: 'Claro',
      notas: 'Notas a caramelo y cítricos',
      precio: 1500,
      fincaOrigen: {
        id: 'finca-la-catalina',
        nombre: 'Finca La Catalina',
        ubicacion: 'Tarrazú',
      },
    },
  ],
  otrasComidas: [{ id: 'Croissant-1200-0', nombre: 'Croissant de almendra', precio: 1200 }],
};

const PUNTOS_PRUEBA: PuntoMapaConsumidor[] = [
  {
    id: 'finca-la-catalina',
    tipo: 'finca',
    nombre: 'Finca La Catalina',
    ubicacionLabel: 'Tarrazú',
    coordenada: { lat: 9.6612, lng: -84.031 },
  },
  {
    id: 'finca-el-roble',
    tipo: 'finca',
    nombre: 'Finca El Roble',
    ubicacionLabel: 'Naranjo',
    coordenada: { lat: 10.1025, lng: -84.3812 },
  },
  {
    id: 'n-tostaduria-volcan',
    tipo: 'tostador',
    nombre: 'Tostaduría Volcán',
    ubicacionLabel: 'San José',
    coordenada: { lat: 9.9335, lng: -84.0775 },
  },
  {
    id: 'c-cafe-brumas',
    tipo: 'cafeteria',
    nombre: 'Café Brumas',
    ubicacionLabel: 'Escazú',
    coordenada: { lat: 9.9205, lng: -84.137 },
  },
];

describe('DashboardConsumidorComponent', () => {
  let fixture: ComponentFixture<DashboardConsumidorComponent>;
  let componente: DashboardConsumidorComponent;
  let pagina: HTMLElement;
  let queryParams$: BehaviorSubject<ParamMap>;
  let obtenerFinca: jasmine.Spy;
  let obtenerTostador: jasmine.Spy;
  let obtenerCafeteria: jasmine.Spy;
  let obtenerMenu: jasmine.Spy;

  beforeEach(async () => {
    queryParams$ = new BehaviorSubject(convertToParamMap({}));
    obtenerFinca = jasmine.createSpy('obtenerFinca').and.returnValue(of(PERFIL_FINCA_PRUEBA));
    obtenerTostador = jasmine
      .createSpy('obtenerTostador')
      .and.returnValue(of(PERFIL_TOSTADOR_PRUEBA));
    obtenerCafeteria = jasmine
      .createSpy('obtenerCafeteria')
      .and.returnValue(of(PERFIL_CAFETERIA_PRUEBA));
    obtenerMenu = jasmine.createSpy('obtenerMenu').and.returnValue(of(MENU_CAFETERIA_PRUEBA));

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
        { provide: PerfilFincaPublicoService, useValue: { obtener: obtenerFinca } },
        { provide: PerfilTostadorService, useValue: { obtener: obtenerTostador } },
        { provide: PerfilCafeteriaService, useValue: { obtener: obtenerCafeteria } },
        { provide: MenuPublicoService, useValue: { obtener: obtenerMenu } },
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

  function abrir(tipo: string, id: string, params: Record<string, string> = {}): void {
    queryParams$.next(convertToParamMap({ seleccionado: id, tipo, ...params }));
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  }

  function espiarNavegacion(): jasmine.Spy {
    return spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  }

  function navegoCon(navegar: jasmine.Spy, queryParams: Record<string, string | null>): void {
    expect(navegar).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  function botonConTexto(texto: string): HTMLButtonElement {
    const boton = [...pagina.querySelectorAll<HTMLButtonElement>('.panel-negocio button')].find(
      (b) => b.textContent?.includes(texto),
    );
    expect(boton).withContext(texto).toBeTruthy();
    return boton!;
  }

  it('muestra un enlace para volver al inicio', () => {
    const enlace = pagina.querySelector<HTMLAnchorElement>('a.volver-inicio');
    expect(enlace).toBeTruthy();
    expect(enlace!.getAttribute('href')).toBe('/');
    expect(enlace!.textContent).toContain('Volver al inicio');
  });

  it('usa los pines del servicio y muestra la leyenda con 3 tipos', () => {
    expect(componente['puntos']()).toEqual(PUNTOS_PRUEBA);

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

  it('al hacer click en un pin abre el panel con seleccionado y tipo', () => {
    const navegar = espiarNavegacion();

    for (const punto of PUNTOS_PRUEBA) {
      navegar.calls.reset();
      componente['abrirPerfil'](punto);
      navegoCon(navegar, { seleccionado: punto.id, tipo: punto.tipo, menu: null });
    }
  });

  it('sin tipo válido no abre el panel', fakeAsync(() => {
    abrir('otro', 'finca-la-catalina');

    expect(pagina.querySelector('.panel-negocio')).toBeNull();
    expect(obtenerFinca).not.toHaveBeenCalled();
  }));

  it('muestra los datos reales de la finca con sus lotes y cafeterías', fakeAsync(() => {
    abrir('finca', 'finca-la-catalina');

    expect(obtenerFinca).toHaveBeenCalledWith('finca-la-catalina');
    const panel = pagina.querySelector('.panel-negocio')!;
    expect(pagina.querySelector('#panel-negocio-titulo')!.textContent).toContain(
      'Finca La Catalina',
    );
    expect(panel.textContent).toContain('Tarrazú, San José');
    expect(panel.textContent).toContain('Café de altura.');
    expect(panel.textContent).toContain('Ana Mora');
    expect(panel.textContent).toContain('Caturra y Geisha');
    expect(panel.querySelector('.panel-negocio__lote')!.textContent).toContain('CRH-2026-0001');
    expect(panel.querySelector('.panel-negocio__lote')!.textContent).toContain('1650 msnm');
    expect(panel.querySelector('.panel-negocio__chip')!.textContent).toContain('Café Brumas');
    expect(panel.querySelector('.panel-menu__toggle')).toBeNull();
  }));

  it('resalta el lote buscado por código', fakeAsync(() => {
    abrir('finca', 'finca-la-catalina', { cosecha: 'cosecha-1' });

    expect(
      pagina
        .querySelector('.panel-negocio__lote')!
        .classList.contains('panel-negocio__lote--resaltado'),
    ).toBeTrue();
  }));

  it('desde la finca navega a la cafetería y resalta sus lotes en el mapa', fakeAsync(() => {
    abrir('finca', 'finca-la-catalina');
    const navegar = espiarNavegacion();

    botonConTexto('Café Brumas').click();
    navegoCon(navegar, { seleccionado: 'c-cafe-brumas', tipo: 'cafeteria', menu: null });

    botonConTexto('Ver lotes trazables').click();
    navegoCon(navegar, { resaltar: 'finca-la-catalina', centrar: 'finca-la-catalina' });
  }));

  it('el tostador navega a fincas y puntos de venta y resalta sus fincas', fakeAsync(() => {
    abrir('tostador', 'n-tostaduria-volcan');

    expect(obtenerTostador).toHaveBeenCalledWith('n-tostaduria-volcan');
    const panel = pagina.querySelector('.panel-negocio')!;
    expect(panel.textContent).toContain('Fincas con las que trabaja');
    expect(panel.textContent).toContain('Dónde comprar su café');
    expect(panel.textContent).toContain('Claro y Medio');

    const navegar = espiarNavegacion();
    botonConTexto('Finca El Roble').click();
    navegoCon(navegar, { seleccionado: 'finca-el-roble', tipo: 'finca', menu: null });

    botonConTexto('Café Brumas').click();
    navegoCon(navegar, { seleccionado: 'c-cafe-brumas', tipo: 'cafeteria', menu: null });

    botonConTexto('Ver fincas con las que trabaja').click();
    navegoCon(navegar, { resaltar: 'finca-la-catalina,finca-el-roble', centrar: null });
  }));

  it('un tostador sin fincas no ofrece resaltarlas', fakeAsync(() => {
    obtenerTostador.and.returnValue(of({ ...PERFIL_TOSTADOR_PRUEBA, fincas: [] }));
    abrir('tostador', 'n-tostaduria-volcan');

    expect(pagina.querySelector('.panel-negocio__accion')).toBeNull();
    expect(pagina.querySelector('.panel-negocio')!.textContent).not.toContain(
      'Fincas con las que trabaja',
    );
  }));

  it('la cafetería navega a sus fincas y tostadores', fakeAsync(() => {
    abrir('cafeteria', 'c-cafe-brumas');
    const navegar = espiarNavegacion();

    botonConTexto('Finca El Roble').click();
    navegoCon(navegar, { seleccionado: 'finca-el-roble', tipo: 'finca', menu: null });

    botonConTexto('Tostaduría Volcán').click();
    navegoCon(navegar, { seleccionado: 'n-tostaduria-volcan', tipo: 'tostador', menu: null });
  }));

  it('en cafetería muestra el menú colapsado y se abre con menu=1', fakeAsync(() => {
    abrir('cafeteria', 'c-cafe-brumas');

    expect(obtenerCafeteria).toHaveBeenCalledWith('c-cafe-brumas');
    expect(obtenerMenu).toHaveBeenCalledWith('c-cafe-brumas');

    const toggle = pagina.querySelector<HTMLButtonElement>('.panel-menu__toggle');
    expect(toggle!.textContent).toContain('Ver menú');
    expect(toggle!.getAttribute('aria-expanded')).toBe('false');
    expect(pagina.querySelector('#panel-menu-contenido')).toBeNull();

    abrir('cafeteria', 'c-cafe-brumas', { menu: '1' });

    expect(obtenerCafeteria).toHaveBeenCalledTimes(1);
    expect(pagina.querySelector('.panel-menu__toggle')!.textContent).toContain('Ocultar menú');
    expect(pagina.querySelector('.panel-menu__contenido')!.textContent).toContain(
      'Espresso Finca La Catalina',
    );
  }));

  it('"Ver origen" abre la finca de origen en el panel', fakeAsync(() => {
    abrir('cafeteria', 'c-cafe-brumas', { menu: '1' });
    const navegar = espiarNavegacion();

    pagina.querySelector<HTMLButtonElement>('.panel-menu__origen')!.click();
    navegoCon(navegar, { seleccionado: 'finca-la-catalina', tipo: 'finca', menu: null });
  }));

  it('muestra vacío cuando la cafetería no tiene ítems en el menú', fakeAsync(() => {
    obtenerMenu.and.returnValue(of({ ...MENU_CAFETERIA_PRUEBA, cafes: [], otrasComidas: [] }));

    abrir('cafeteria', 'c-cafe-brumas', { menu: '1' });

    expect(pagina.querySelector('.panel-menu__vacio')?.textContent).toContain(
      'Esta cafetería aún no tiene ítems en el menú.',
    );
  }));

  it('muestra carga mientras llega el perfil', fakeAsync(() => {
    const perfil$ = new Subject<PerfilFincaPublico | null>();
    obtenerFinca.and.returnValue(perfil$.asObservable());

    abrir('finca', 'finca-la-catalina');

    expect(pagina.querySelector('[role="status"]')?.textContent).toContain('Cargando…');
    expect(pagina.querySelector('#panel-negocio-titulo')).toBeNull();

    perfil$.next(PERFIL_FINCA_PRUEBA);
    perfil$.complete();
    fixture.detectChanges();

    expect(pagina.querySelector('[role="status"]')).toBeNull();
    expect(pagina.querySelector('.panel-negocio__desc')?.textContent).toContain('Café de altura.');
  }));

  it('muestra error si falla la carga y permite reintentar', fakeAsync(() => {
    obtenerCafeteria.and.returnValue(throwError(() => new Error('falló')));

    abrir('cafeteria', 'c-cafe-brumas');

    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain(
      'No pudimos cargar este negocio',
    );
    expect(pagina.querySelector('.panel-menu__toggle')).toBeNull();

    obtenerCafeteria.and.returnValue(of(PERFIL_CAFETERIA_PRUEBA));
    botonConTexto('Reintentar').click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(obtenerCafeteria).toHaveBeenCalledTimes(2);
    expect(pagina.querySelector('#panel-negocio-titulo')!.textContent).toContain('Café Brumas');
  }));

  it('un negocio inexistente o eliminado muestra no encontrado', fakeAsync(() => {
    obtenerTostador.and.returnValue(of(null));

    abrir('tostador', 'tostador-eliminado');

    expect(pagina.querySelector('.panel-negocio')!.textContent).toContain(
      'No encontramos este negocio',
    );
    expect(pagina.querySelector('#panel-negocio-titulo')).toBeNull();
  }));

  it('cerrar el panel limpia la selección', fakeAsync(() => {
    abrir('finca', 'finca-la-catalina');
    const navegar = espiarNavegacion();

    pagina.querySelector<HTMLButtonElement>('.panel-negocio__cerrar')!.click();
    navegoCon(navegar, { seleccionado: null, tipo: null, cosecha: null, menu: null });
  }));

  it('con código válido abre el panel de la finca con query cosecha', () => {
    const navegar = espiarNavegacion();

    buscarCodigo('CRH-2026-0103');

    expect(pagina.querySelector('.barra-busqueda__error')).toBeNull();
    navegoCon(navegar, {
      seleccionado: 'finca-el-roble',
      tipo: 'finca',
      resaltar: 'finca-el-roble',
      cosecha: 'cosecha-catuai-el-roble',
      menu: null,
    });
  });

  it('con código inválido muestra el mensaje de error', () => {
    const navegar = espiarNavegacion();

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
    queryParams$.next(convertToParamMap({ seleccionado: punto.id, tipo: punto.tipo }));
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
