import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CAFETERIA_EJEMPLO } from '../mocks/cafeteria.mock';
import { ItemMenu, ItemMenuResponseApi, NuevoItemMenu } from '../models/menu-cafeteria.model';
import { CafeteriaService } from './cafeteria.service';
import { MenuCafeteriaService } from './menu-cafeteria.service';

const CAFETERIA_ID = CAFETERIA_EJEMPLO.id;
const BASE_MENU = `${environment.apiUrl}/api/cafeterias/${CAFETERIA_ID}/menu`;

const ITEM_API: ItemMenuResponseApi = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  nombre: 'Espresso Tarrazú',
  categoria: 'CAFE',
  codigoTrazabilidad: 'CRH-2026-0101-T01',
  precio: 1800,
};

const ITEM_UI: ItemMenu = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  nombre: 'Espresso Tarrazú',
  categoria: 'Café',
  codigoTrazabilidad: 'CRH-2026-0101-T01',
  precio: 1800,
};

describe('MenuCafeteriaService', () => {
  let servicio: MenuCafeteriaService;
  let http: HttpTestingController;
  let cafeterias: jasmine.SpyObj<Pick<CafeteriaService, 'obtenerActual'>>;

  beforeEach(() => {
    cafeterias = jasmine.createSpyObj('CafeteriaService', ['obtenerActual']);
    cafeterias.obtenerActual.and.returnValue(of(CAFETERIA_EJEMPLO));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CafeteriaService, useValue: cafeterias },
      ],
    });
    servicio = TestBed.inject(MenuCafeteriaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista el menú con credenciales y mapea la categoría', () => {
    let lista: ItemMenu[] | undefined;
    servicio.listar().subscribe((items) => (lista = items));

    const peticion = http.expectOne(BASE_MENU);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush([
      ITEM_API,
      {
        id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
        nombre: 'Queque de naranja',
        categoria: 'OTRA_COMIDA',
        codigoTrazabilidad: null,
        precio: 1500,
      },
    ]);

    expect(lista).toEqual([
      ITEM_UI,
      {
        id: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
        nombre: 'Queque de naranja',
        categoria: 'Otra comida',
        codigoTrazabilidad: null,
        precio: 1500,
      },
    ]);
  });

  it('publica un ítem con el cuerpo del backend', () => {
    const nuevo: NuevoItemMenu = {
      nombre: 'Latte',
      categoria: 'Café',
      codigoTrazabilidad: 'CRH-2026-0098-T01',
      precio: 2600,
    };
    let publicado: ItemMenu | undefined;
    servicio.publicar(nuevo).subscribe((item) => (publicado = item));

    const peticion = http.expectOne(BASE_MENU);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.withCredentials).toBeTrue();
    expect(peticion.request.body).toEqual({
      nombre: 'Latte',
      categoria: 'CAFE',
      codigoTrazabilidad: 'CRH-2026-0098-T01',
      precio: 2600,
    });
    peticion.flush({
      id: 'cccccccc-dddd-eeee-ffff-000000000000',
      nombre: 'Latte',
      categoria: 'CAFE',
      codigoTrazabilidad: 'CRH-2026-0098-T01',
      precio: 2600,
    });

    expect(publicado).toEqual({
      id: 'cccccccc-dddd-eeee-ffff-000000000000',
      nombre: 'Latte',
      categoria: 'Café',
      codigoTrazabilidad: 'CRH-2026-0098-T01',
      precio: 2600,
    });
  });

  it('quita un ítem por id', () => {
    let listo = false;
    servicio.quitar(ITEM_UI.id).subscribe(() => (listo = true));

    const peticion = http.expectOne(`${BASE_MENU}/${ITEM_UI.id}`);
    expect(peticion.request.method).toBe('DELETE');
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush(null, { status: 204, statusText: 'No Content' });
    expect(listo).toBeTrue();
  });

  it('propaga errores HTTP de listar', () => {
    let status: number | undefined;
    servicio.listar().subscribe({
      error: (error: { status: number }) => (status = error.status),
    });

    http.expectOne(BASE_MENU).flush(null, { status: 500, statusText: 'Error' });
    expect(status).toBe(500);
  });

  it('propaga el 404 de código inexistente al publicar', () => {
    let status: number | undefined;
    let mensaje: string | undefined;
    servicio
      .publicar({
        nombre: 'Latte',
        categoria: 'Café',
        codigoTrazabilidad: 'CRH-0000',
        precio: 2600,
      })
      .subscribe({
        error: (error: { status: number; error: { mensaje: string } }) => {
          status = error.status;
          mensaje = error.error.mensaje;
        },
      });

    http
      .expectOne(BASE_MENU)
      .flush(
        { mensaje: 'No hay un lote activo con el código CRH-0000.' },
        { status: 404, statusText: 'Not Found' },
      );
    expect(status).toBe(404);
    expect(mensaje).toBe('No hay un lote activo con el código CRH-0000.');
  });

  it('propaga errores HTTP al quitar', () => {
    let status: number | undefined;
    servicio.quitar(ITEM_UI.id).subscribe({
      error: (error: { status: number }) => (status = error.status),
    });

    http.expectOne(`${BASE_MENU}/${ITEM_UI.id}`).flush(null, { status: 500, statusText: 'Error' });
    expect(status).toBe(500);
  });

  it('falla si no hay cafetería registrada', () => {
    cafeterias.obtenerActual.and.returnValue(of(undefined));

    let mensaje: string | undefined;
    servicio.listar().subscribe({
      error: (error: Error) => (mensaje = error.message),
    });

    http.expectNone(BASE_MENU);
    expect(mensaje).toBe('No hay una cafetería registrada.');
  });
});
