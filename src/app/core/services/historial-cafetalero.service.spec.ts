import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { HistorialCafetaleroResponseApi } from '../models/historial-cafetalero.model';
import { HistorialCafetaleroService } from './historial-cafetalero.service';

const BASE_HISTORIAL = `${environment.apiUrl}/api/cafetalero/historial`;

function paginaApi<T>(contenido: T[]) {
  return {
    contenido,
    pagina: 0,
    tamano: 50,
    totalElementos: contenido.length,
    totalPaginas: 1,
  };
}

function historialApi(
  cambios: Partial<HistorialCafetaleroResponseApi> = {},
): HistorialCafetaleroResponseApi {
  return {
    indicadores: {
      cosechasRegistradas: 2,
      produccionTotalKg: 210,
      lotesVendidos: 1,
    },
    cosechas: paginaApi([
      {
        id: 'cosecha-catuai-catalina',
        fincaId: 'finca-la-catalina',
        finca: 'La Catalina',
        variedad: 'Catuaí',
        fechaInicio: '2025-12-01',
        fechaFin: '2025-12-10',
        cantidadCosechadaKg: 90,
        estado: 'BORRADOR' as const,
      },
      {
        id: 'cosecha-caturra-catalina',
        fincaId: 'finca-la-catalina',
        finca: 'La Catalina',
        variedad: 'Caturra',
        fechaInicio: '2025-11-01',
        fechaFin: '2025-11-15',
        cantidadCosechadaKg: 120,
        estado: 'PUBLICADA' as const,
      },
    ]),
    lotesVendidos: paginaApi([
      {
        id: 'lote-1',
        codigo: 'CRN-LC-2511-01',
        cosechaId: 'cosecha-caturra-catalina',
        fincaId: 'finca-la-catalina',
        finca: 'La Catalina',
        variedad: 'Caturra',
        comprador: 'Café Altamira',
        kg: 50,
        precioKg: 4200,
        total: 210000,
        vendidoEn: '2025-11-20',
      },
    ]),
    ...cambios,
  };
}

describe('HistorialCafetaleroService', () => {
  let servicio: HistorialCafetaleroService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(HistorialCafetaleroService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function cargar(cuerpo = historialApi()): void {
    servicio.cargar().subscribe();
    const peticion = http.expectOne(
      (req) => req.url === BASE_HISTORIAL && req.params.get('tamano') === '50',
    );
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush(cuerpo);
  }

  it('obtiene el historial y mapea indicadores, cosechas y lotes', () => {
    cargar();

    expect(servicio.indicadores()).toEqual({
      cosechasRegistradas: 2,
      produccionTotalKg: 210,
      lotesVendidos: 1,
    });
    expect(servicio.cosechas()).toHaveSize(2);
    expect(servicio.cosechas()[0]).toEqual({
      id: 'cosecha-catuai-catalina',
      fincaId: 'finca-la-catalina',
      finca: 'La Catalina',
      variedad: 'Catuaí',
      fechaInicio: '2025-12-01',
      fechaFin: '2025-12-10',
      cantidadCosechadaKg: 90,
      estado: 'Borrador',
    });
    expect(servicio.lotesVendidos()).toHaveSize(1);
    expect(servicio.lotesVendidos()[0].codigo).toBe('CRN-LC-2511-01');
    expect(servicio.lotesVendidos()[0].total).toBe(210000);
  });

  it('convierte BigDecimal de producción a número', () => {
    cargar(
      historialApi({
        indicadores: {
          cosechasRegistradas: 1,
          produccionTotalKg: '90.5' as unknown as number,
          lotesVendidos: 0,
        },
      }),
    );

    expect(servicio.indicadores()?.produccionTotalKg).toBe(90.5);
  });

  it('permite pasar pagina y tamano personalizados', () => {
    servicio.cargar({ pagina: 1, tamano: 20 }).subscribe();

    const peticion = http.expectOne(
      (req) =>
        req.url === BASE_HISTORIAL &&
        req.params.get('pagina') === '1' &&
        req.params.get('tamano') === '20',
    );
    expect(peticion.request.method).toBe('GET');
    peticion.flush(historialApi());
  });
});
