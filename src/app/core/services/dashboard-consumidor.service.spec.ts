import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { mapearPuntoMapaResponseAConsumidor } from '../mappers/punto-mapa-consumidor.mapper';
import { PuntoMapaConsumidor, PuntoMapaResponseApi } from '../models/punto-mapa-consumidor.model';
import { DashboardConsumidorService } from './dashboard-consumidor.service';
import { CLAVE_TEMA } from './tema.service';

const URL_MAPA = `${environment.apiUrl}/api/publico/mapa`;

const PUNTOS_API: PuntoMapaResponseApi[] = [
  {
    tipo: 'FINCA',
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    nombre: 'Finca La Catalina',
    canton: 'Tarrazú',
    provincia: 'San José',
    coordenada: { lat: 9.6612, lng: -84.031 },
  },
  {
    tipo: 'TOSTADOR',
    id: '11111111-2222-3333-4444-555555555555',
    nombre: 'Tostaduría Volcán',
    canton: 'San José',
    provincia: 'San José',
    coordenada: { lat: 9.9335, lng: -84.0775 },
  },
  {
    tipo: 'CAFETERIA',
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    nombre: 'Café Brumas',
    canton: 'Escazú',
    provincia: 'San José',
    coordenada: { lat: 9.9205, lng: -84.137 },
  },
];

describe('DashboardConsumidorService', () => {
  let servicio: DashboardConsumidorService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(DashboardConsumidorService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(CLAVE_TEMA);
  });

  it('obtiene pines del mapa público y los mapea a UI', () => {
    let puntos: PuntoMapaConsumidor[] | undefined;
    servicio.puntos().subscribe((respuesta) => (puntos = respuesta));

    const req = http.expectOne(URL_MAPA);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(PUNTOS_API);

    expect(puntos).toEqual(PUNTOS_API.map(mapearPuntoMapaResponseAConsumidor));

    const tipos = new Set(puntos!.map((p) => p.tipo));
    expect(tipos).toEqual(new Set(['finca', 'tostador', 'cafeteria']));
  });

  it('resuelve el código válido de ejemplo a finca y cosecha', () => {
    expect(servicio.buscarCodigo('CRH-2026-0103')).toEqual({
      codigo: 'CRH-2026-0103',
      fincaId: 'finca-el-roble',
      cosechaId: 'cosecha-catuai-el-roble',
    });
    expect(servicio.buscarCodigo('  crh-2026-0103  ')).toEqual({
      codigo: 'CRH-2026-0103',
      fincaId: 'finca-el-roble',
      cosechaId: 'cosecha-catuai-el-roble',
    });
  });

  it('devuelve null para códigos vacíos o desconocidos', () => {
    expect(servicio.buscarCodigo('')).toBeNull();
    expect(servicio.buscarCodigo('   ')).toBeNull();
    expect(servicio.buscarCodigo('CRH-9999-0000')).toBeNull();
  });

  it('alterna el tema entre claro y oscuro', () => {
    expect(servicio.tema()).toBe('claro');
    servicio.establecerTema('oscuro');
    expect(servicio.tema()).toBe('oscuro');
    servicio.establecerTema('claro');
    expect(servicio.tema()).toBe('claro');
  });
});
