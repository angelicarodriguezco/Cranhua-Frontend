import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER, Subject, of, throwError } from 'rxjs';

import { CAFETERIA_EJEMPLO } from '../../core/mocks/cafeteria.mock';
import { Coordenada } from '../../core/models/finca.model';
import { ItemMenu } from '../../core/models/menu-cafeteria.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { MenuCafeteriaService } from '../../core/services/menu-cafeteria.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { RUTA_REGISTRAR_CAFETERIA } from '../../core/guards/cafeteria.guard';
import {
  avisoEliminarCafeteria,
  DESCRIPCION_ELIMINAR_CAFETERIA,
  inicialesCafeteria,
  MiCafeteriaComponent,
  RUTA_PUBLICAR_MENU,
} from './mi-cafeteria.component';
import { responderCantones } from '../../core/testing/cantones-de-prueba';

const ESCAZU: Coordenada = { lat: 9.9189, lng: -84.1397 };
const OCEANO: Coordenada = { lat: 8.5, lng: -86.5 };

const ITEMS_MENU: ItemMenu[] = [
  {
    id: 'menu-1',
    nombre: 'Espresso Tarrazú',
    categoria: 'Café',
    codigoTrazabilidad: 'CRH-2026-0101-T01',
    precio: 1800,
  },
  {
    id: 'menu-2',
    nombre: 'Queque de naranja',
    categoria: 'Otra comida',
    codigoTrazabilidad: null,
    precio: 1500,
  },
];

describe('MiCafeteriaComponent', () => {
  let fixture: ComponentFixture<MiCafeteriaComponent>;
  let componente: MiCafeteriaComponent;
  let pagina: HTMLElement;
  let cafeteriaService: CafeteriaService;
  let menuService: MenuCafeteriaService;
  let dashboard: DashboardCafeteriaService;
  let listarMenu: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiCafeteriaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
      ],
    }).compileComponents();

    cafeteriaService = TestBed.inject(CafeteriaService);
    menuService = TestBed.inject(MenuCafeteriaService);
    dashboard = TestBed.inject(DashboardCafeteriaService);
    spyOn(cafeteriaService, 'obtenerActual').and.returnValue(of(CAFETERIA_EJEMPLO));
    listarMenu = spyOn(menuService, 'listar').and.returnValue(of(ITEMS_MENU));

    fixture = TestBed.createComponent(MiCafeteriaComponent);
    responderCantones();
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  function campo<T extends HTMLElement>(selector: string): T {
    return pagina.querySelector<T>(selector)!;
  }

  function boton(texto: string): HTMLButtonElement {
    const encontrado = [...pagina.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(texto),
    );
    if (!encontrado) {
      throw new Error(`No hay botón "${texto}"`);
    }
    return encontrado;
  }

  function entrarAEdicion(): void {
    boton('Editar cafetería').click();
    fixture.detectChanges();
  }

  function errores(): string[] {
    return [...pagina.querySelectorAll('.campo__error')].map((e) => e.textContent!.trim());
  }

  it('calcula iniciales del nombre de la cafetería', () => {
    expect(inicialesCafeteria('Café Brumas')).toBe('CB');
    expect(inicialesCafeteria('Brumas')).toBe('BR');
  });

  it('muestra la vista de solo lectura de la cafetería', () => {
    expect(campo('h1').textContent).toContain('Mi cafetería');
    expect(pagina.textContent).toContain('Así ven tu local los tostadores dentro de Cránhua.');
    const valores = [...pagina.querySelectorAll('.campo__valor')].map((v) => v.textContent!.trim());
    expect(valores).toContain(CAFETERIA_EJEMPLO.nombre);
    expect(valores).toContain(CAFETERIA_EJEMPLO.contacto);
    expect(valores).toContain(CAFETERIA_EJEMPLO.correo);
    expect(valores.some((v) => v.includes('Escazú'))).toBeTrue();
    expect(campo('.avatar__iniciales').textContent!.trim()).toBe('CB');
    expect(pagina.querySelector('.mapa--solo-lectura')).toBeTruthy();
    expect(pagina.textContent).toContain('Claro');
    expect(pagina.textContent).toContain('Medio');
    expect(pagina.querySelector('#nombre-cafeteria')).toBeNull();
    expect(pagina.querySelector('app-zona-peligro')).toBeNull();
    expect(boton('Editar cafetería')).toBeTruthy();
    expect(boton('Publicar en el menú')).toBeTruthy();
  });

  it('muestra el menú publicado colapsado y lo abre al hacer click', () => {
    const toggle = campo<HTMLButtonElement>('.menu-publicado__toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(pagina.querySelector('#menu-publicado-contenido')).toBeNull();
    expect(pagina.textContent).toContain('Menú publicado');
    expect(pagina.textContent).toContain('(2)');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(pagina.querySelector('#menu-publicado-contenido')).toBeTruthy();
    expect(pagina.textContent).toContain('Cafés');
    expect(pagina.textContent).toContain('Espresso Tarrazú');
    expect(pagina.textContent).toContain('Otras comidas');
    expect(pagina.textContent).toContain('Queque de naranja');
    expect(pagina.textContent).toContain('Ocultar');
  });

  it('muestra loading del menú mientras lista', () => {
    const listar$ = new Subject<ItemMenu[]>();
    listarMenu.and.returnValue(listar$.asObservable());
    componente['cargarMenu']();
    boton('Ver menú').click();
    fixture.detectChanges();

    expect(pagina.querySelector('[role="status"]')?.textContent).toContain('Cargando menú…');
    expect(pagina.querySelector('.menu-publicado__conteo')).toBeNull();

    listar$.next(ITEMS_MENU);
    listar$.complete();
    fixture.detectChanges();

    expect(pagina.querySelector('[role="status"]')).toBeNull();
    expect(pagina.textContent).toContain('(2)');
    expect(pagina.textContent).toContain('Espresso Tarrazú');
  });

  it('muestra vacío cuando el menú no tiene ítems', () => {
    listarMenu.and.returnValue(of([]));
    componente['cargarMenu']();
    boton('Ver menú').click();
    fixture.detectChanges();

    expect(pagina.textContent).toContain('(0)');
    expect(pagina.querySelector('.menu-publicado__vacio')?.textContent).toContain(
      'Todavía no tenés ítems en el menú.',
    );
  });

  it('muestra error del menú y permite reintentar', () => {
    listarMenu.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            statusText: 'Error',
            error: { mensaje: 'No se pudo cargar el menú.' },
          }),
      ),
    );
    componente['cargarMenu']();
    fixture.detectChanges();

    boton('Ver menú').click();
    fixture.detectChanges();

    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo cargar el menú.',
    );
    expect(pagina.querySelector('.menu-publicado__conteo')).toBeNull();

    listarMenu.and.returnValue(of(ITEMS_MENU));
    boton('Reintentar').click();
    fixture.detectChanges();

    expect(pagina.textContent).toContain('Espresso Tarrazú');
    expect(pagina.textContent).toContain('(2)');
  });

  it('entra a edición y carga los datos de la cafetería', () => {
    entrarAEdicion();

    expect(campo('h1').textContent).toContain('Editar cafetería');
    expect(boton('Cambiar portada')).toBeTruthy();
    expect(pagina.textContent).toContain('Mover pin en el mapa');
    expect(campo<HTMLInputElement>('#nombre-cafeteria').value).toBe(CAFETERIA_EJEMPLO.nombre);
    expect(campo<HTMLInputElement>('#contacto-cafeteria').value).toBe(CAFETERIA_EJEMPLO.contacto);
    expect(campo<HTMLInputElement>('#telefono-cafeteria').value).toBe(CAFETERIA_EJEMPLO.telefono);
    expect(campo<HTMLInputElement>('#correo-cafeteria').value).toBe(CAFETERIA_EJEMPLO.correo);
    expect(campo<HTMLTextAreaElement>('#descripcion-cafeteria').value).toBe(
      CAFETERIA_EJEMPLO.descripcion ?? '',
    );
    expect(campo<HTMLInputElement>('#horario-cafeteria').value).toBe(
      CAFETERIA_EJEMPLO.horario ?? '',
    );
    expect(campo('.avatar__iniciales').textContent!.trim()).toBe('CB');
    expect(campo<HTMLInputElement>('#ubicacion-cafeteria').value).toBe('Escazú, San José');
    expect(campo<HTMLInputElement>('#ubicacion-cafeteria').readOnly).toBeTrue();
    expect(componente['estilosDisponibles']).toEqual(['Claro', 'Medio', 'Oscuro']);
    expect(pagina.textContent).not.toContain('Espresso');
  });

  it('muestra errores al guardar con campos vacíos', () => {
    entrarAEdicion();
    componente['formulario'].reset({
      nombre: '',
      descripcion: '',
      horario: '',
      contacto: '',
      telefono: '',
      correo: '',
    });
    componente['estilos'].reset([]);
    componente['pin'].set(null);
    fixture.detectChanges();

    boton('Guardar cambios').click();
    fixture.detectChanges();

    expect(errores().length).toBeGreaterThan(0);
    expect(pagina.textContent).toContain('Poné el nombre de tu cafetería.');
    expect(pagina.textContent).toContain('Elegí al menos un estilo de café.');
    expect(pagina.textContent).toContain('Marcá en el mapa dónde está tu local.');
  });

  it('permite alternar estilos de café', () => {
    entrarAEdicion();
    expect(componente['seleccionado']('Claro')).toBeTrue();
    expect(componente['seleccionado']('Medio')).toBeTrue();
    expect(componente['seleccionado']('Oscuro')).toBeFalse();

    boton('Oscuro').click();
    fixture.detectChanges();
    expect(componente['seleccionado']('Oscuro')).toBeTrue();

    boton('Claro').click();
    fixture.detectChanges();
    expect(componente['seleccionado']('Claro')).toBeFalse();
  });

  it('actualiza el texto de ubicación desde el pin', () => {
    entrarAEdicion();
    componente['pin'].set(ESCAZU);
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#ubicacion-cafeteria').value).toBe('Escazú, San José');

    componente['pin'].set(OCEANO);
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#ubicacion-cafeteria').value).toBe('');
  });

  it('rechaza guardar si el pin queda fuera de los cantones', () => {
    entrarAEdicion();
    const actualizar = spyOn(cafeteriaService, 'actualizar');
    componente['pin'].set(OCEANO);
    fixture.detectChanges();

    boton('Guardar cambios').click();
    fixture.detectChanges();

    expect(actualizar).not.toHaveBeenCalled();
    expect(pagina.textContent).toContain(
      'El pin está fuera de los cantones de Costa Rica. Movelo más cerca de tu local.',
    );
  });

  it('navega a publicar en el menú', () => {
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    boton('Publicar en el menú').click();
    fixture.detectChanges();

    expect(navegar).toHaveBeenCalledWith(RUTA_PUBLICAR_MENU);
  });

  it('sin historial confirma un borrado normal y lleva a Registrar cafetería', () => {
    entrarAEdicion();
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const eliminar = spyOn(cafeteriaService, 'eliminar').and.returnValue(of(undefined));

    expect(pagina.querySelector('app-zona-peligro')).toBeTruthy();
    expect(pagina.textContent).toContain(DESCRIPCION_ELIMINAR_CAFETERIA);

    boton('Eliminar cafetería').click();
    fixture.detectChanges();
    expect(campo('.modal__titulo').textContent).toBe('¿Eliminar Cafetería Café Brumas?');
    expect(pagina.querySelector('.modal__aviso')).toBeNull();
    expect(getComputedStyle(pagina.querySelector('.modal__dialogo')!).backgroundColor).toBe(
      'rgb(255, 255, 255)',
    );

    campo<HTMLButtonElement>('.modal__btn--peligro').click();
    fixture.detectChanges();

    expect(eliminar).toHaveBeenCalledWith(CAFETERIA_EJEMPLO.id);
    expect(navegar).toHaveBeenCalledWith(RUTA_REGISTRAR_CAFETERIA);
  });

  it('con historial el modal avisa con el código del detalle', () => {
    const historial = { tieneHistorial: true, codigoEjemplo: 'CRH-2026-0101-T01' };
    (cafeteriaService.obtenerActual as jasmine.Spy).and.returnValue(
      of({ ...CAFETERIA_EJEMPLO, historialTrazabilidad: historial }),
    );
    fixture = TestBed.createComponent(MiCafeteriaComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();

    entrarAEdicion();
    boton('Eliminar cafetería').click();
    fixture.detectChanges();

    expect(campo('.modal__aviso').textContent).toContain(avisoEliminarCafeteria(historial)!);
    expect(campo('.modal__aviso').textContent).toContain('CRH-2026-0101-T01');
  });

  it('si el backend rechaza la eliminación muestra su mensaje y no navega', () => {
    entrarAEdicion();
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    spyOn(cafeteriaService, 'eliminar').and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { mensaje: 'No se pudo eliminar la cafetería.' },
          }),
      ),
    );

    boton('Eliminar cafetería').click();
    fixture.detectChanges();
    campo<HTMLButtonElement>('.modal__btn--peligro').click();
    fixture.detectChanges();

    expect(pagina.querySelector('app-modal-confirmacion')).toBeNull();
    expect(campo('[role="alert"]').textContent).toContain('No se pudo eliminar la cafetería.');
    expect(navegar).not.toHaveBeenCalled();
  });

  it('guarda cambios y vuelve a la vista', () => {
    entrarAEdicion();
    const guardado$ = new Subject<typeof CAFETERIA_EJEMPLO>();
    const actualizar = spyOn(cafeteriaService, 'actualizar').and.returnValue(
      guardado$.asObservable(),
    );
    const actualizarPortada = spyOn(cafeteriaService, 'actualizarPortada');

    campo<HTMLInputElement>('#nombre-cafeteria').value = 'Café Brumas Norte';
    campo<HTMLInputElement>('#nombre-cafeteria').dispatchEvent(new Event('input'));
    fixture.detectChanges();

    boton('Guardar cambios').click();
    fixture.detectChanges();

    expect(actualizar).toHaveBeenCalled();
    expect(boton('Guardar cambios').disabled).toBeTrue();
    expect(actualizarPortada).not.toHaveBeenCalled();
    const guardado = actualizar.calls.mostRecent().args[0];
    expect(guardado.id).toBe(CAFETERIA_EJEMPLO.id);
    expect(guardado.nombre).toBe('Café Brumas Norte');
    expect(guardado.volumenMensual).toBe(CAFETERIA_EJEMPLO.volumenMensual);
    expect(guardado.portadaUrl).toBe(CAFETERIA_EJEMPLO.portadaUrl);

    guardado$.next({ ...CAFETERIA_EJEMPLO, nombre: 'Café Brumas Norte' });
    guardado$.complete();
    fixture.detectChanges();

    expect(pagina.querySelector('.campo__valor')?.textContent).toContain('Café Brumas Norte');
    expect(pagina.querySelector('#nombre-cafeteria')).toBeNull();
  });

  it('sube la portada después de guardar los datos', () => {
    entrarAEdicion();
    const archivo = new File(['x'], 'portada.png', { type: 'image/png' });
    const conPortada = {
      ...CAFETERIA_EJEMPLO,
      nombre: 'Café Brumas Norte',
      portadaUrl: 'https://cdn.ejemplo.cr/nueva.jpg',
    };
    spyOn(cafeteriaService, 'actualizar').and.callFake((cafeteria) => of(cafeteria));
    const actualizarPortada = spyOn(cafeteriaService, 'actualizarPortada').and.returnValue(
      of(conPortada),
    );

    campo<HTMLInputElement>('#nombre-cafeteria').value = 'Café Brumas Norte';
    campo<HTMLInputElement>('#nombre-cafeteria').dispatchEvent(new Event('input'));
    componente['alSeleccionarPortada']({
      target: { files: [archivo], value: '' },
    } as unknown as Event);
    fixture.detectChanges();

    boton('Guardar cambios').click();
    fixture.detectChanges();

    expect(actualizarPortada).toHaveBeenCalledWith(CAFETERIA_EJEMPLO.id, archivo);
    expect(pagina.querySelector('.campo__valor')?.textContent).toContain('Café Brumas Norte');
  });

  it('muestra el error del backend al fallar el guardado', () => {
    entrarAEdicion();
    spyOn(cafeteriaService, 'actualizar').and.returnValue(
      throwError(() => ({ status: 500, error: { mensaje: 'No se pudo guardar.' } })),
    );

    boton('Guardar cambios').click();
    fixture.detectChanges();

    expect(pagina.textContent).toContain('No se pudo completar la solicitud. Intentá de nuevo.');
    expect(pagina.querySelector('#nombre-cafeteria')).toBeTruthy();
  });

  it('rechaza una portada con tipo inválido', () => {
    entrarAEdicion();
    const archivo = new File(['x'], 'portada.gif', { type: 'image/gif' });
    componente['alSeleccionarPortada']({
      target: { files: [archivo], value: 'portada.gif' },
    } as unknown as Event);
    fixture.detectChanges();

    expect(pagina.textContent).toContain('Solo se permiten imágenes JPG, PNG o WebP.');
    expect(componente['archivoPortada']).toBeNull();
  });

  it('cancela y vuelve a la vista con el estado guardado', () => {
    entrarAEdicion();
    campo<HTMLInputElement>('#nombre-cafeteria').value = 'Otro nombre';
    campo<HTMLInputElement>('#nombre-cafeteria').dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#nombre-cafeteria').value).toBe('Otro nombre');

    boton('Cancelar').click();
    fixture.detectChanges();
    expect(pagina.querySelector('.campo__valor')?.textContent).toContain(CAFETERIA_EJEMPLO.nombre);
    expect(pagina.querySelector('#nombre-cafeteria')).toBeNull();
  });

  it('sigue el tema global claro/oscuro', () => {
    expect(dashboard.tema()).toBe('claro');
    expect(pagina.getAttribute('data-theme')).toBe('claro');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(dashboard.tema()).toBe('oscuro');
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
  });
});
