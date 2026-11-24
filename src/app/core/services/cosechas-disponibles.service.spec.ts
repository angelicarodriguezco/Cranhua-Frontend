import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import {
  CosechaDisponible,
  CosechaDisponibleApi,
  IMAGEN_COSECHA_DISPONIBLE,
  SIN_FILTROS,
} from '../models/cosecha-disponible.model';
import { COSECHAS_DISPONIBLES_FIXTURE } from '../testing/cosechas-disponibles.fixture';
import { CosechasDisponiblesService, filtrarCosechas } from './cosechas-disponibles.service';

const BASE = `${environment.apiUrl}/api/cosechas/disponibles`;

function cosechaApi(cambios: Partial<CosechaDisponibleApi> = {}): CosechaDisponibleApi {
  return {
    id: 'c-1',
    fincaId: 'f-1',
    finca: 'La Catalina',
    zona: 'Tarrazú',
    canton: 'Tarrazú',
    provincia: 'San José',
    variedad: 'Caturra',
    proceso: 'Red honey',
    notas: ['Panela', 'Jazmín'],
    precioKg: 5800,
    ...cambios,
  };
}

describe('filtrarCosechas', () => {
  const ids = (filtros: Partial<typeof SIN_FILTROS>) =>
    filtrarCosechas(COSECHAS_DISPONIBLES_FIXTURE, { ...SIN_FILTROS, ...filtros }).map((c) => c.id);

  it('sin filtros de cliente devuelve todas', () => {
    expect(ids({})).toHaveSize(COSECHAS_DISPONIBLES_FIXTURE.length);
  });

  it('"Disponible ahora" deja fuera las próximas', () => {
    expect(ids({ soloDisponibles: true })).not.toContain('cosecha-sl28-quebrada-honda');
    expect(ids({ soloDisponibles: true })).toHaveSize(6);
  });

  it('filtra por variedad', () => {
    expect(ids({ variedad: 'Catuaí' })).toEqual([
      'cosecha-catuai-los-robles',
      'cosecha-catuai-la-esperanza',
    ]);
  });

  it('filtra por rango de precio', () => {
    expect(ids({ rangoPrecio: 'bajo' })).toEqual([
      'cosecha-caturra-catalina',
      'cosecha-catuai-los-robles',
      'cosecha-catuai-la-esperanza',
    ]);
    expect(ids({ rangoPrecio: 'alto' })).toEqual([
      'cosecha-geisha-monte-alto',
      'cosecha-bourbon-cerro-verde',
    ]);
  });

  it('combina filtros de cliente', () => {
    expect(ids({ variedad: 'Caturra', soloDisponibles: true })).toEqual([
      'cosecha-caturra-catalina',
      'cosecha-caturra-el-mirador',
    ]);
  });

  it('acepta una lista vacía', () => {
    const vacia: CosechaDisponible[] = [];
    expect(filtrarCosechas(vacia, SIN_FILTROS)).toEqual([]);
  });
});

describe('CosechasDisponiblesService', () => {
  let servicio: CosechasDisponiblesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(CosechasDisponiblesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista cosechas del API con credentials y las mapea', () => {
    let resultado: unknown;
    servicio.listar().subscribe((lista) => (resultado = lista));

    const peticion = http.expectOne(BASE);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.withCredentials).toBeTrue();
    expect(peticion.request.params.keys()).toEqual([]);
    peticion.flush([cosechaApi()]);

    expect(resultado).toEqual([cosechaDisponibleEsperada()]);
  });

  it('envía zona, florales y honey como query params', () => {
    servicio.listar({ zona: 'Tarrazú', florales: true, honey: true }).subscribe();

    const peticion = http.expectOne(
      (r) =>
        r.url === BASE &&
        r.params.get('zona') === 'Tarrazú' &&
        r.params.get('florales') === 'true' &&
        r.params.get('honey') === 'true',
    );
    expect(peticion.request.method).toBe('GET');
    peticion.flush([]);
  });

  it('omite params en false o sin zona', () => {
    servicio.listar({ zona: null, florales: false, honey: false }).subscribe();

    const peticion = http.expectOne(BASE);
    expect(peticion.request.params.keys()).toEqual([]);
    peticion.flush([]);
  });
});

function cosechaDisponibleEsperada() {
  return {
    id: 'c-1',
    finca: 'La Catalina',
    zona: 'Tarrazú' as const,
    ubicacion: 'Tarrazú, San José',
    variedad: 'Caturra',
    proceso: 'Red honey',
    notas: ['Panela', 'Jazmín'],
    precioDesdeKg: 5800,
    disponibilidad: 'Disponible' as const,
    imagenUrl: IMAGEN_COSECHA_DISPONIBLE,
  };
}
