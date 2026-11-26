import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { IMAGEN_COSECHA_DISPONIBLE } from '../models/cosecha-disponible.model';
import { DetalleCosechaDisponibleApi } from '../models/detalle-cosecha.model';
import { DetalleCosechaService } from './detalle-cosecha.service';

const BASE = `${environment.apiUrl}/api/cosechas/disponibles`;
const BASE_SOLICITUDES = `${environment.apiUrl}/api/solicitudes`;

function detalleApi(
  cambios: Partial<DetalleCosechaDisponibleApi> = {},
): DetalleCosechaDisponibleApi {
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
    procesos: [{ proceso: 'Red honey', porcentaje: 100 }],
    alturaMsnm: 1650,
    kgDisponibles: 320,
    puntajeSca: 86.5,
    codigoLote: 'LC-2026-001',
    productores: [
      {
        id: 'u-1',
        nombreCompleto: 'Rodrigo Solís Ureña',
        correo: 'rodrigo@ejemplo.cr',
        telefono: '8888-1234',
      },
    ],
    ...cambios,
  };
}

describe('DetalleCosechaService', () => {
  let servicio: DetalleCosechaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(DetalleCosechaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene el detalle del API con credentials y lo mapea', () => {
    let resultado: unknown;
    servicio.obtener('c-1').subscribe((detalle) => (resultado = detalle));

    const peticion = http.expectOne(`${BASE}/c-1`);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush(detalleApi());

    expect(resultado).toEqual({
      id: 'c-1',
      finca: 'La Catalina',
      zona: 'Tarrazú',
      ubicacion: 'Tarrazú, San José',
      variedad: 'Caturra',
      proceso: 'Red honey',
      notas: ['Panela', 'Jazmín'],
      precioDesdeKg: 5800,
      disponibilidad: 'Disponible',
      imagenUrl: IMAGEN_COSECHA_DISPONIBLE,
      altitudMsnm: 1650,
      kgDisponibles: 320,
      precioKg: 5800,
      descripcion: 'Lote LC-2026-001 · SCA 86.5',
      productor: {
        id: 'u-1',
        nombre: 'Rodrigo',
        apellidos: 'Solís Ureña',
        correo: 'rodrigo@ejemplo.cr',
      },
    });
  });

  it('devuelve undefined si el API responde 404', () => {
    let resultado: unknown = 'sin-emitir';
    servicio.obtener('no-existe').subscribe((detalle) => (resultado = detalle));

    http
      .expectOne(`${BASE}/no-existe`)
      .flush({ mensaje: 'Cosecha no encontrada' }, { status: 404, statusText: 'Not Found' });

    expect(resultado).toBeUndefined();
  });

  it('propaga errores que no son 404', () => {
    let error: unknown;
    servicio.obtener('c-1').subscribe({ error: (e) => (error = e) });

    http
      .expectOne(`${BASE}/c-1`)
      .flush({ mensaje: 'Falló la red' }, { status: 500, statusText: 'Server Error' });

    expect(error).toBeTruthy();
  });

  it('envía la solicitud con cantidadKg y sin precioKg', () => {
    let ok = false;
    servicio
      .enviarSolicitud({ cosechaId: 'c-1', kilos: 20, precioKg: 5800 })
      .subscribe(() => (ok = true));

    const peticion = http.expectOne(BASE_SOLICITUDES);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.withCredentials).toBeTrue();
    expect(peticion.request.body).toEqual({ cosechaId: 'c-1', cantidadKg: 20 });
    peticion.flush({
      id: 's-1',
      cosechaId: 'c-1',
      cantidadKg: 20,
      precioKg: 5800,
      totalEstimado: 116000,
      estado: 'PENDIENTE',
      solicitadaEn: '2026-11-20T15:00:00.000Z',
      respondidaEn: null,
      codigoLote: null,
    });

    expect(ok).toBeTrue();
  });
});
