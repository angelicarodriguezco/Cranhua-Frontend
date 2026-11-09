import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { CAFETERIA_EJEMPLO } from '../mocks/cafeteria.mock';
import {
  Cafeteria,
  CafeteriaResponseApi,
  NuevaCafeteria,
} from '../models/cafeteria.model';
import { cafeteriaDesdeApi, cuerpoRegistro } from '../utils/cafeteria-desde-api';
import { CafeteriaService } from './cafeteria.service';

const BASE = `${environment.apiUrl}/api/cafeterias`;

function cafeteriaApi(cambios: Partial<CafeteriaResponseApi> = {}): CafeteriaResponseApi {
  return {
    id: CAFETERIA_EJEMPLO.id,
    cuentaId: CAFETERIA_EJEMPLO.propietarioId,
    nombre: CAFETERIA_EJEMPLO.nombre,
    nombreContacto: CAFETERIA_EJEMPLO.contacto,
    telefono: CAFETERIA_EJEMPLO.telefono,
    correo: CAFETERIA_EJEMPLO.correo,
    descripcion: CAFETERIA_EJEMPLO.descripcion,
    horario: CAFETERIA_EJEMPLO.horario,
    ubicacion: CAFETERIA_EJEMPLO.ubicacion,
    canton: CAFETERIA_EJEMPLO.canton!.nombre,
    provincia: CAFETERIA_EJEMPLO.canton!.provincia,
    estilos: ['CLARO', 'MEDIO'],
    volumenMensual: 'DE_25_A_50',
    portadaUrl: null,
    ...cambios,
  };
}

const NUEVA: NuevaCafeteria = {
  nombre: CAFETERIA_EJEMPLO.nombre,
  contacto: CAFETERIA_EJEMPLO.contacto,
  telefono: CAFETERIA_EJEMPLO.telefono,
  correo: CAFETERIA_EJEMPLO.correo,
  descripcion: CAFETERIA_EJEMPLO.descripcion,
  horario: CAFETERIA_EJEMPLO.horario,
  ubicacion: CAFETERIA_EJEMPLO.ubicacion,
  canton: CAFETERIA_EJEMPLO.canton,
  volumenMensual: CAFETERIA_EJEMPLO.volumenMensual,
  estilos: [...CAFETERIA_EJEMPLO.estilos],
  propietarioId: CAFETERIA_EJEMPLO.propietarioId,
  portadaUrl: null,
};

describe('CafeteriaService', () => {
  let servicio: CafeteriaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(CafeteriaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('ubica una cafetería en Chepe centro', () => {
    expect(servicio.cantonDe({ lat: 9.9335, lng: -84.0775 })?.nombre).toBe('San José');
  });

  it('no asigna cantón a un punto lejos de todos', () => {
    expect(servicio.cantonDe({ lat: 11.2, lng: -85.6 })).toBeNull();
  });

  describe('obtenerActual', () => {
    it('hace GET /actual con credenciales y mapea la respuesta', () => {
      let actual: Cafeteria | undefined;
      servicio.obtenerActual().subscribe((cafeteria) => (actual = cafeteria));

      const req = http.expectOne(`${BASE}/actual`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBeTrue();
      req.flush(cafeteriaApi());
      expect(actual).toEqual(cafeteriaDesdeApi(cafeteriaApi()));
    });

    it('reutiliza la respuesta en llamadas siguientes sin nuevo GET', () => {
      let primera: Cafeteria | undefined;
      let segunda: Cafeteria | undefined;
      servicio.obtenerActual().subscribe((cafeteria) => (primera = cafeteria));
      http.expectOne(`${BASE}/actual`).flush(cafeteriaApi());

      servicio.obtenerActual().subscribe((cafeteria) => (segunda = cafeteria));
      http.expectNone(`${BASE}/actual`);
      expect(segunda).toEqual(primera);
    });

    it('con 404 devuelve undefined', () => {
      let actual: Cafeteria | undefined | null = null;
      servicio.obtenerActual().subscribe((cafeteria) => (actual = cafeteria));

      http
        .expectOne(`${BASE}/actual`)
        .flush(
          { mensaje: 'Tu cuenta todavía no tiene una cafetería registrada.' },
          { status: 404, statusText: 'Not Found' },
        );
      expect(actual).toBeUndefined();
    });

    it('con otro error lo propaga', () => {
      let errorStatus = 0;
      servicio.obtenerActual().subscribe({
        error: (error) => (errorStatus = error.status),
      });

      http
        .expectOne(`${BASE}/actual`)
        .flush({ mensaje: 'Sin sesión.' }, { status: 401, statusText: 'Unauthorized' });
      expect(errorStatus).toBe(401);
    });
  });

  describe('registrar', () => {
    it('hace POST con el formato del backend y sin propietarioId', () => {
      let registrada: Cafeteria | undefined;
      servicio.registrar(NUEVA).subscribe((cafeteria) => (registrada = cafeteria));

      const req = http.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBeTrue();
      expect(req.request.body).toEqual(cuerpoRegistro(NUEVA));
      expect(req.request.body.propietarioId).toBeUndefined();
      req.flush(cafeteriaApi(), { status: 201, statusText: 'Created' });
      expect(registrada).toEqual(cafeteriaDesdeApi(cafeteriaApi()));
    });
  });

  describe('registrarActual', () => {
    it('hace POST con credenciales y el cuerpo de registro', () => {
      const { propietarioId: _propietarioId, ...sinPropietario } = NUEVA;
      let registrada: Cafeteria | undefined;
      servicio.registrarActual(sinPropietario).subscribe((cafeteria) => (registrada = cafeteria));

      const req = http.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBeTrue();
      expect(req.request.body).toEqual(cuerpoRegistro(sinPropietario));
      req.flush(cafeteriaApi(), { status: 201, statusText: 'Created' });
      expect(registrada).toEqual(cafeteriaDesdeApi(cafeteriaApi()));
    });

    it('deja la cafetería registrada en caché para obtenerActual', () => {
      const { propietarioId: _propietarioId, ...sinPropietario } = NUEVA;
      servicio.registrarActual(sinPropietario).subscribe();
      http.expectOne(BASE).flush(cafeteriaApi(), { status: 201, statusText: 'Created' });

      let actual: Cafeteria | undefined;
      servicio.obtenerActual().subscribe((cafeteria) => (actual = cafeteria));
      http.expectNone(`${BASE}/actual`);
      expect(actual).toEqual(cafeteriaDesdeApi(cafeteriaApi()));
    });
  });

  describe('actualizar', () => {
    it('hace PATCH /{id} con el cuerpo de registro y mapea la respuesta', () => {
      const actualizada: Cafeteria = {
        ...CAFETERIA_EJEMPLO,
        nombre: 'Café Brumas Escazú',
        estilos: ['Oscuro'],
        portadaUrl: 'https://cdn.ejemplo.cr/portada.jpg',
      };
      let guardada: Cafeteria | undefined;
      servicio.actualizar(actualizada).subscribe((cafeteria) => (guardada = cafeteria));

      const req = http.expectOne(`${BASE}/${actualizada.id}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.withCredentials).toBeTrue();
      const { id: _id, propietarioId: _propietarioId, ...datos } = actualizada;
      expect(req.request.body).toEqual(cuerpoRegistro(datos));
      req.flush(
        cafeteriaApi({
          nombre: 'Café Brumas Escazú',
          estilos: ['OSCURO'],
          portadaUrl: 'https://cdn.ejemplo.cr/portada.jpg',
        }),
      );
      expect(guardada).toEqual(
        cafeteriaDesdeApi(
          cafeteriaApi({
            nombre: 'Café Brumas Escazú',
            estilos: ['OSCURO'],
            portadaUrl: 'https://cdn.ejemplo.cr/portada.jpg',
          }),
        ),
      );
    });
  });

  it('eliminar responde false porque no hay endpoint todavía', () => {
    let ok: boolean | undefined;
    servicio.eliminar(CAFETERIA_EJEMPLO.id).subscribe((resultado) => (ok = resultado));
    expect(ok).toBeFalse();
  });
});
