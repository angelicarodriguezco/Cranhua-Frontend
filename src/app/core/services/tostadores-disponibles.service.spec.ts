import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { SIN_FILTROS, TostadorDisponible } from '../models/tostador-disponible.model';
import { TOSTADORES_API } from '../testing/pedidos-cafeteria.fixture';
import { TostadoresDisponiblesService } from './tostadores-disponibles.service';

const BASE = `${environment.apiUrl}/api/tostadores`;

describe('TostadoresDisponiblesService', () => {
  let servicio: TostadoresDisponiblesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(TostadoresDisponiblesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sin filtros pide la lista completa con credenciales y la mapea', () => {
    let lista: TostadorDisponible[] = [];
    servicio.listar().subscribe((r) => (lista = r));

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.params.keys()).toEqual([]);
    req.flush(TOSTADORES_API);

    expect(lista[0]).toEqual({
      id: 't-volcan',
      nombre: 'Tostaduría Volcán',
      ubicacion: 'San José, San José',
      estilos: ['Claro', 'Medio'],
      kgDisponibles: 85,
    });
    expect(lista[1].estilos).toEqual(['Oscuro']);
  });

  it('manda el estilo en el formato del backend y "disponible" cuando se pide café', () => {
    servicio.listar({ ...SIN_FILTROS, estilo: 'Oscuro', soloConCafe: true }).subscribe();

    const req = http.expectOne((r) => r.url === BASE);
    expect(req.request.params.get('estilo')).toBe('OSCURO');
    expect(req.request.params.get('disponible')).toBe('true');
    req.flush([]);
  });
});
