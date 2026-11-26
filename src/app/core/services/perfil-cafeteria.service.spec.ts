import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PerfilCafeteria } from '../models/perfil-cafeteria.model';
import { PerfilCafeteriaService } from './perfil-cafeteria.service';

const CAFETERIA_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const URL_PERFIL = `${environment.apiUrl}/api/publico/cafeterias/${CAFETERIA_ID}`;

describe('PerfilCafeteriaService', () => {
  let servicio: PerfilCafeteriaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(PerfilCafeteriaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene y mapea el perfil público', () => {
    let perfil: PerfilCafeteria | null | undefined;
    servicio.obtener(CAFETERIA_ID).subscribe((resultado) => (perfil = resultado));

    const peticion = http.expectOne(URL_PERFIL);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush({
      id: CAFETERIA_ID,
      nombre: 'Café Brumas',
      descripcion: 'Especialidad costarricense',
      horario: 'Lun a sáb, 7:00 a 19:00',
      canton: 'Escazú',
      provincia: 'San José',
      ubicacion: { lat: 9.9205, lng: -84.137 },
      estilos: ['CLARO'],
      portadaUrl: null,
      miembroDesde: '2025-06-10T12:00:00Z',
      cafesTrazables: 3,
      fincas: [
        {
          id: 'finca-1',
          nombre: 'Finca La Catalina',
          canton: 'Tarrazú',
          provincia: 'San José',
        },
        {
          id: 'finca-2',
          nombre: 'Finca El Roble',
          canton: 'Naranjo',
          provincia: 'Alajuela',
        },
      ],
      tostadores: [
        {
          id: 'tostador-1',
          nombre: 'Tostaduría Volcán',
          canton: 'San José',
          provincia: 'San José',
        },
      ],
    });

    expect(perfil?.nombre).toBe('Café Brumas');
    expect(perfil?.ubicacion).toBe('Escazú, San José');
    expect(perfil?.miembroDesde).toBe('2025-06-10');
    expect(perfil?.cafesTrazables).toBe(3);
    expect(perfil?.fincas.length).toBe(2);
  });

  it('devuelve null si el id no existe', () => {
    let perfil: PerfilCafeteria | null | undefined = undefined;
    servicio.obtener(CAFETERIA_ID).subscribe((resultado) => (perfil = resultado));

    http.expectOne(URL_PERFIL).flush('No encontrada', { status: 404, statusText: 'Not Found' });
    expect(perfil).toBeNull();
  });

  it('propaga errores distintos de 404', () => {
    let status: number | undefined;
    servicio.obtener(CAFETERIA_ID).subscribe({
      error: (error: { status: number }) => (status = error.status),
    });

    http.expectOne(URL_PERFIL).flush(null, { status: 500, statusText: 'Error' });
    expect(status).toBe(500);
  });
});
