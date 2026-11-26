import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PerfilTostador } from '../models/perfil-tostador.model';
import { PerfilTostadorService } from './perfil-tostador.service';

const TOSTADOR_ID = '11111111-2222-3333-4444-555555555555';
const URL_PERFIL = `${environment.apiUrl}/api/publico/tostadores/${TOSTADOR_ID}`;

describe('PerfilTostadorService', () => {
  let servicio: PerfilTostadorService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(PerfilTostadorService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene y mapea el perfil público del tostador', () => {
    let perfil: PerfilTostador | null | undefined;
    servicio.obtener(TOSTADOR_ID).subscribe((resultado) => (perfil = resultado));

    const peticion = http.expectOne(URL_PERFIL);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush({
      id: TOSTADOR_ID,
      nombre: 'Tostaduría Volcán',
      descripcion: '  Tueste en lotes pequeños  ',
      canton: 'San José',
      provincia: 'San José',
      estilos: ['CLARO', 'OSCURO'],
      miembroDesde: '2025-08-20T09:00:00Z',
      fincas: [{ id: 'finca-1', nombre: 'Finca La Catalina', canton: 'Tarrazú', provincia: '' }],
      puntosVenta: [],
    });

    expect(perfil).toEqual({
      id: TOSTADOR_ID,
      nombre: 'Tostaduría Volcán',
      ubicacion: 'San José',
      descripcion: 'Tueste en lotes pequeños',
      estilos: ['Claro', 'Oscuro'],
      portadaUrl: null,
      miembroDesde: '2025-08-20',
      fincas: [{ id: 'finca-1', nombre: 'Finca La Catalina', ubicacion: 'Tarrazú' }],
      puntosVenta: [],
    });
  });

  it('devuelve null si el tostador no existe o fue eliminado', () => {
    let perfil: PerfilTostador | null | undefined;
    servicio.obtener(TOSTADOR_ID).subscribe((resultado) => (perfil = resultado));

    http.expectOne(URL_PERFIL).flush('No encontrado', { status: 404, statusText: 'Not Found' });
    expect(perfil).toBeNull();
  });

  it('propaga errores distintos de 404', () => {
    let status: number | undefined;
    servicio.obtener(TOSTADOR_ID).subscribe({
      error: (error: { status: number }) => (status = error.status),
    });

    http.expectOne(URL_PERFIL).flush(null, { status: 500, statusText: 'Error' });
    expect(status).toBe(500);
  });
});
