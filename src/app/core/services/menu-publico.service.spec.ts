import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { MenuPublico } from '../models/menu-publico.model';
import { MenuPublicoService } from './menu-publico.service';

const CAFETERIA_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const URL_MENU = `${environment.apiUrl}/api/publico/cafeterias/${CAFETERIA_ID}/menu`;

describe('MenuPublicoService', () => {
  let servicio: MenuPublicoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(MenuPublicoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene y mapea el menú público', () => {
    let menu: MenuPublico | null | undefined;
    servicio.obtener(CAFETERIA_ID).subscribe((resultado) => (menu = resultado));

    const peticion = http.expectOne(URL_MENU);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush({
      id: CAFETERIA_ID,
      nombre: 'Café Brumas',
      canton: 'Escazú',
      provincia: 'San José',
      ubicacion: { lat: 9.92, lng: -84.13 },
      cafes: [
        {
          nombre: 'Espresso',
          precio: 1500,
          nivelTueste: 'CLARO',
          notas: ['Caramelo'],
          fincaOrigen: {
            id: 'finca-1',
            nombre: 'Finca La Catalina',
            canton: 'Tarrazú',
            provincia: 'San José',
          },
        },
      ],
      otrasComidas: [{ nombre: 'Croissant', precio: 1200 }],
    });

    expect(menu).toEqual({
      cafeteriaId: CAFETERIA_ID,
      nombre: 'Café Brumas',
      ubicacion: 'Escazú, San José',
      cafes: [
        {
          id: 'Espresso-1500-0',
          nombre: 'Espresso',
          nivelTueste: 'Claro',
          notas: 'Caramelo',
          precio: 1500,
          fincaOrigen: {
            id: 'finca-1',
            nombre: 'Finca La Catalina',
            ubicacion: 'Tarrazú, San José',
          },
        },
      ],
      otrasComidas: [{ id: 'Croissant-1200-0', nombre: 'Croissant', precio: 1200 }],
    });
  });

  it('devuelve null si la cafetería no existe', () => {
    let menu: MenuPublico | null | undefined = undefined;
    servicio.obtener(CAFETERIA_ID).subscribe((resultado) => (menu = resultado));

    http.expectOne(URL_MENU).flush('No encontrada', { status: 404, statusText: 'Not Found' });
    expect(menu).toBeNull();
  });

  it('propaga errores distintos de 404', () => {
    let status: number | undefined;
    servicio.obtener(CAFETERIA_ID).subscribe({
      error: (error: { status: number }) => (status = error.status),
    });

    http.expectOne(URL_MENU).flush(null, { status: 500, statusText: 'Error' });
    expect(status).toBe(500);
  });
});
