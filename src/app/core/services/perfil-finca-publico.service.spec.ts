import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PerfilFincaPublico } from '../models/perfil-finca-publico.model';
import { PerfilFincaPublicoService } from './perfil-finca-publico.service';

const FINCA_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const URL_PERFIL = `${environment.apiUrl}/api/publico/fincas/${FINCA_ID}`;

describe('PerfilFincaPublicoService', () => {
  let servicio: PerfilFincaPublicoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(PerfilFincaPublicoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene y mapea el perfil público de la finca', () => {
    let perfil: PerfilFincaPublico | null | undefined;
    servicio.obtener(FINCA_ID).subscribe((resultado) => (perfil = resultado));

    const peticion = http.expectOne(URL_PERFIL);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush({
      id: FINCA_ID,
      nombre: 'Finca La Catalina',
      zonaCafetalera: 'Tarrazú',
      canton: 'Tarrazú',
      provincia: 'San José',
      ubicacion: { lat: 9.6612, lng: -84.031 },
      perimetro: [],
      propietarios: ['Ana Mora'],
      variedades: ['Caturra'],
      procesos: ['Honey'],
      enCranhuaDesde: '2025-03-01T10:00:00Z',
      cosechasActivas: [
        {
          id: 'cosecha-1',
          codigoLote: 'CRH-2026-0001',
          variedad: 'Caturra',
          proceso: 'Honey',
          alturaMsnm: 1650,
          kgDisponibles: '120.50',
        },
      ],
      cafeterias: [
        { id: 'cafeteria-1', nombre: 'Café Brumas', canton: 'Escazú', provincia: 'San José' },
      ],
    });

    expect(perfil).toEqual({
      id: FINCA_ID,
      nombre: 'Finca La Catalina',
      ubicacion: 'Tarrazú, San José',
      descripcion: '',
      zona: 'Tarrazú',
      propietarios: ['Ana Mora'],
      variedades: ['Caturra'],
      procesos: ['Honey'],
      enCranhuaDesde: '2025-03-01',
      cosechasActivas: [
        {
          id: 'cosecha-1',
          codigo: 'CRH-2026-0001',
          variedad: 'Caturra',
          proceso: 'Honey',
          alturaMsnm: 1650,
          kgDisponibles: 120.5,
        },
      ],
      cafeterias: [{ id: 'cafeteria-1', nombre: 'Café Brumas', ubicacion: 'Escazú, San José' }],
    });
  });

  it('devuelve null si la finca no existe o fue eliminada', () => {
    let perfil: PerfilFincaPublico | null | undefined;
    servicio.obtener(FINCA_ID).subscribe((resultado) => (perfil = resultado));

    http.expectOne(URL_PERFIL).flush('No encontrada', { status: 404, statusText: 'Not Found' });
    expect(perfil).toBeNull();
  });

  it('propaga errores distintos de 404', () => {
    let status: number | undefined;
    servicio.obtener(FINCA_ID).subscribe({
      error: (error: { status: number }) => (status = error.status),
    });

    http.expectOne(URL_PERFIL).flush(null, { status: 500, statusText: 'Error' });
    expect(status).toBe(500);
  });
});
