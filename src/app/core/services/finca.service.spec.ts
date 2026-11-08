import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { CANTONES, USUARIO_ACTUAL } from '../mocks/finca.mock';
import {
  ErrorRegistroFinca,
  FincaResponseApi,
  NuevaFinca,
  ResultadoAgregarDueno,
  ResultadoRegistro,
  ResultadoRegistroConDuenos,
} from '../models/finca.model';
import { fincaDesdeApi } from '../utils/finca-desde-api';
import { FincaService } from './finca.service';

const BASE = `${environment.apiUrl}/api/fincas`;

const PERIMETRO = [
  { lat: 9.65, lng: -84.03 },
  { lat: 9.65, lng: -84.02 },
  { lat: 9.66, lng: -84.02 },
];

const TARRAZU = CANTONES.find((c) => c.nombre === 'Tarrazú')!;

function fincaApi(cambios: Partial<FincaResponseApi> = {}): FincaResponseApi {
  return {
    id: 'f-1',
    nombre: 'Finca La Catalina',
    descripcion: 'Café de altura',
    zonaCafetalera: 'Tarrazú',
    perimetro: PERIMETRO,
    ubicacion: { lat: 9.655, lng: -84.025 },
    canton: 'Tarrazú',
    provincia: 'San José',
    areaHectareas: 121.38,
    duenos: [
      { id: 'u-lucia', nombreCompleto: 'Lucía Mora Castro' },
      { id: USUARIO_ACTUAL.id, nombreCompleto: 'Rodrigo Solís Ureña' },
    ],
    ...cambios,
  };
}

const NUEVA: NuevaFinca = {
  nombre: 'Finca La Catalina',
  descripcion: null,
  zona: 'Tarrazú',
  perimetro: PERIMETRO,
  ubicacion: { lat: 9.655, lng: -84.025 },
  canton: TARRAZU,
};

describe('FincaService', () => {
  let servicio: FincaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(FincaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('fincaDesdeApi', () => {
    it('deja al usuario actual como propietario y al resto como dueños adicionales', () => {
      const finca = fincaDesdeApi(fincaApi(), USUARIO_ACTUAL.id);
      expect(finca.propietarioId).toBe(USUARIO_ACTUAL.id);
      expect(finca.duenosAdicionales).toEqual([
        { id: 'u-lucia', nombre: 'Lucía', apellidos: 'Mora Castro', correo: '' },
      ]);
      expect(finca.zona).toBe('Tarrazú');
      expect(finca.areaHectareas).toBe(121.38);
    });

    it('usa al primer dueño como propietario si el usuario actual no es dueño', () => {
      const finca = fincaDesdeApi(fincaApi(), 'u-otro');
      expect(finca.propietarioId).toBe('u-lucia');
      expect(finca.duenosAdicionales.map((d) => d.id)).toEqual([USUARIO_ACTUAL.id]);
    });

    it('toma el cantón de la lista o lo arma con los datos de la finca', () => {
      expect(fincaDesdeApi(fincaApi(), USUARIO_ACTUAL.id).canton).toBe(TARRAZU);

      const otra = fincaApi({
        canton: 'Cantón Nuevo',
        provincia: 'Puntarenas',
        zonaCafetalera: null,
      });
      expect(fincaDesdeApi(otra, USUARIO_ACTUAL.id).canton).toEqual({
        nombre: 'Cantón Nuevo',
        provincia: 'Puntarenas',
        zona: null,
        cabecera: otra.ubicacion,
      });
    });
  });

  it('misFincas hace GET con credenciales', () => {
    let nombres: string[] = [];
    servicio.misFincas().subscribe((fincas) => (nombres = fincas.map((f) => f.nombre)));

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    req.flush([fincaApi(), fincaApi({ id: 'f-2', nombre: 'Finca El Roble' })]);
    expect(nombres).toEqual(['Finca La Catalina', 'Finca El Roble']);
  });

  it('obtener hace GET de la finca con credenciales', () => {
    let id = '';
    servicio.obtener('f-1').subscribe((finca) => (id = finca.id));

    const req = http.expectOne(`${BASE}/f-1`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(fincaApi());
    expect(id).toBe('f-1');
  });

  describe('registrar', () => {
    let resultado: ResultadoRegistro | undefined;
    let error: ErrorRegistroFinca | undefined;

    beforeEach(() => {
      resultado = undefined;
      error = undefined;
      servicio.registrar(NUEVA).subscribe({
        next: (r) => (resultado = r),
        error: (e) => (error = e),
      });
    });

    it('hace POST con el formato del backend y credenciales', () => {
      const req = http.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBeTrue();
      expect(req.request.body).toEqual({
        nombre: 'Finca La Catalina',
        descripcion: null,
        zonaCafetalera: 'Tarrazú',
        perimetro: PERIMETRO,
        ubicacion: { lat: 9.655, lng: -84.025 },
        canton: 'Tarrazú',
        provincia: 'San José',
      });
      req.flush(fincaApi(), { status: 201, statusText: 'Created' });
      expect(resultado).toEqual({
        registrada: true,
        finca: fincaDesdeApi(fincaApi(), USUARIO_ACTUAL.id),
      });
    });

    it('con 409 devuelve el conflicto y el mensaje', () => {
      const conflicto = {
        fincaId: 'f-tucan',
        nombre: 'Finca El Tucán',
        duenos: [{ id: 'u-andres', nombreCompleto: 'Andrés Vargas Quesada' }],
        perimetro: PERIMETRO,
      };
      const mensaje =
        'El terreno se sobrepone con la finca "Finca El Tucán" de Andrés Vargas Quesada.';
      http.expectOne(BASE).flush({ mensaje, conflicto }, { status: 409, statusText: 'Conflict' });
      expect(resultado).toEqual({ registrada: false, conflicto, mensaje });
    });

    it('con 400 devuelve los mensajes por campo', () => {
      http
        .expectOne(BASE)
        .flush(
          { mensaje: 'Revisá los datos ingresados.', errores: { canton: 'Ingresá el cantón.' } },
          { status: 400, statusText: 'Bad Request' },
        );
      expect(resultado).toBeUndefined();
      expect(error).toEqual({
        mensaje: 'Revisá los datos ingresados.',
        errores: { canton: 'Ingresá el cantón.' },
      });
    });

    it('con un error de red devuelve el error genérico', () => {
      http.expectOne(BASE).error(new ProgressEvent('error'));
      expect(error).toEqual({
        mensaje: 'No pudimos registrar la finca. Intentá de nuevo.',
        errores: {},
      });
    });
  });

  describe('agregarDueno', () => {
    let resultado: ResultadoAgregarDueno | undefined;

    beforeEach(() => {
      resultado = undefined;
      servicio.agregarDueno('f-1', 'lucia@ejemplo.cr').subscribe((r) => (resultado = r));
    });

    it('hace POST con el correo y credenciales', () => {
      const req = http.expectOne(`${BASE}/f-1/duenos`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBeTrue();
      expect(req.request.body).toEqual({ correo: 'lucia@ejemplo.cr' });
      req.flush(fincaApi());
      expect(resultado).toEqual({
        agregado: true,
        finca: fincaDesdeApi(fincaApi(), USUARIO_ACTUAL.id),
      });
    });

    it('con 404 o 409 devuelve el mensaje del backend tal cual', () => {
      const mensaje = 'No encontramos una cuenta de cafetalero con ese correo.';
      http
        .expectOne(`${BASE}/f-1/duenos`)
        .flush({ mensaje }, { status: 404, statusText: 'Not Found' });
      expect(resultado).toEqual({ agregado: false, mensaje });

      servicio.agregarDueno('f-1', 'lucia@ejemplo.cr').subscribe((r) => (resultado = r));
      http
        .expectOne(`${BASE}/f-1/duenos`)
        .flush(
          { mensaje: 'Esa cuenta ya es dueña de esta finca.' },
          { status: 409, statusText: 'Conflict' },
        );
      expect(resultado).toEqual({
        agregado: false,
        mensaje: 'Esa cuenta ya es dueña de esta finca.',
      });
    });

    it('con otro error devuelve un mensaje genérico', () => {
      http.expectOne(`${BASE}/f-1/duenos`).error(new ProgressEvent('error'));
      expect(resultado).toEqual({
        agregado: false,
        mensaje: 'No pudimos agregar a ese dueño. Intentá de nuevo.',
      });
    });
  });

  it('quitarDueno hace DELETE con credenciales', () => {
    let duenos = 0;
    servicio.quitarDueno('f-1', 'u-lucia').subscribe((f) => (duenos = f.duenosAdicionales.length));

    const req = http.expectOne(`${BASE}/f-1/duenos/u-lucia`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(
      fincaApi({ duenos: [{ id: USUARIO_ACTUAL.id, nombreCompleto: 'Rodrigo Solís Ureña' }] }),
    );
    expect(duenos).toBe(0);
  });

  describe('registrarConDuenos', () => {
    it('crea la finca y después agrega los dueños uno por uno, aunque alguno falle', () => {
      let resultado: ResultadoRegistroConDuenos | undefined;
      servicio
        .registrarConDuenos(NUEVA, ['lucia@ejemplo.cr', 'nadie@ejemplo.cr'])
        .subscribe((r) => (resultado = r));

      http
        .expectOne(BASE)
        .flush(
          fincaApi({ duenos: [{ id: USUARIO_ACTUAL.id, nombreCompleto: 'Rodrigo Solís Ureña' }] }),
          {
            status: 201,
            statusText: 'Created',
          },
        );

      const primero = http.expectOne(`${BASE}/f-1/duenos`);
      expect(primero.request.body).toEqual({ correo: 'lucia@ejemplo.cr' });
      primero.flush(fincaApi());

      const segundo = http.expectOne(`${BASE}/f-1/duenos`);
      expect(segundo.request.body).toEqual({ correo: 'nadie@ejemplo.cr' });
      segundo.flush(
        { mensaje: 'No encontramos una cuenta de cafetalero con ese correo.' },
        { status: 404, statusText: 'Not Found' },
      );

      expect(resultado).toEqual({
        registrada: true,
        finca: fincaDesdeApi(fincaApi(), USUARIO_ACTUAL.id),
        duenosFallidos: [
          {
            correo: 'nadie@ejemplo.cr',
            mensaje: 'No encontramos una cuenta de cafetalero con ese correo.',
          },
        ],
      });
    });

    it('sin dueños adicionales responde apenas se crea la finca', () => {
      let resultado: ResultadoRegistroConDuenos | undefined;
      servicio.registrarConDuenos(NUEVA, []).subscribe((r) => (resultado = r));

      http.expectOne(BASE).flush(fincaApi(), { status: 201, statusText: 'Created' });
      expect(resultado).toEqual({
        registrada: true,
        finca: fincaDesdeApi(fincaApi(), USUARIO_ACTUAL.id),
        duenosFallidos: [],
      });
    });

    it('con 409 no intenta agregar dueños', () => {
      let resultado: ResultadoRegistroConDuenos | undefined;
      servicio.registrarConDuenos(NUEVA, ['lucia@ejemplo.cr']).subscribe((r) => (resultado = r));

      http.expectOne(BASE).flush(
        {
          mensaje: 'Se sobrepone.',
          conflicto: { fincaId: 'f-x', nombre: 'X', duenos: [], perimetro: [] },
        },
        { status: 409, statusText: 'Conflict' },
      );
      expect(resultado?.registrada).toBeFalse();
    });
  });

  it('ubica el cantón más cercano al pin', () => {
    expect(servicio.cantonDe({ lat: 9.66, lng: -84.03 })?.nombre).toBe('Tarrazú');
    expect(servicio.cantonDe({ lat: 11.2, lng: -85.6 })).toBeNull();
  });

  it('busca cantones sin tildes', () => {
    expect(servicio.buscarCanton('tarrazu')?.nombre).toBe('Tarrazú');
    expect(servicio.buscarCanton('san ra')?.nombre).toBe('San Ramón');
    expect(servicio.buscarCanton('Narnia')).toBeUndefined();
  });
});
