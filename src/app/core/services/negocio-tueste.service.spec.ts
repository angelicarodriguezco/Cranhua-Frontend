import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DatosNegocioTueste, NegocioTueste } from '../models/negocio-tueste.model';
import { NEGOCIO_API, URL_TOSTADORES } from '../testing/negocio-tueste.fixture';
import { NegocioTuesteService } from './negocio-tueste.service';

const DATOS: DatosNegocioTueste = {
  nombre: 'Tostaduría Volcán',
  descripcion: null,
  contacto: 'Mariana Castro',
  telefono: '+506 8888-1234',
  correo: 'contacto@volcan.cr',
  canton: { nombre: 'Tibás', provincia: 'San José' },
  estilos: ['Claro', 'Medio'],
};

const CUERPO = {
  nombre: 'Tostaduría Volcán',
  nombreContacto: 'Mariana Castro',
  telefono: '+506 8888-1234',
  correo: 'contacto@volcan.cr',
  descripcion: '',
  canton: 'Tibás',
  provincia: 'San José',
  estilos: ['CLARO', 'MEDIO'],
};

describe('NegocioTuesteService', () => {
  let servicio: NegocioTuesteService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(NegocioTuesteService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('registra el negocio con el formato del backend', () => {
    let registrado: NegocioTueste | undefined;
    servicio.registrar(DATOS).subscribe((negocio) => (registrado = negocio));

    const peticion = http.expectOne(URL_TOSTADORES);
    const { request } = peticion;
    expect(request.method).toBe('POST');
    expect(request.withCredentials).toBeTrue();
    expect(request.body).toEqual(CUERPO);
    peticion.flush(NEGOCIO_API);
    expect(registrado).toEqual({
      ...DATOS,
      id: 'n-volcan',
      descripcion: 'Perfiles claros y medios.',
      portadaUrl: null,
    });
  });

  it('actualiza sin tocar la portada y borra la descripción vacía', () => {
    servicio.actualizar('n-volcan', DATOS).subscribe();

    const { request } = http.expectOne(`${URL_TOSTADORES}/n-volcan`);
    expect(request.method).toBe('PATCH');
    expect(request.withCredentials).toBeTrue();
    expect(request.body).toEqual(CUERPO);
  });

  it('sube la portada como archivo', () => {
    const archivo = new File(['x'], 'portada.png', { type: 'image/png' });
    servicio.actualizarPortada('n-volcan', archivo).subscribe();

    const { request } = http.expectOne(`${URL_TOSTADORES}/n-volcan/portada`);
    expect(request.method).toBe('POST');
    expect(request.withCredentials).toBeTrue();
    expect((request.body as FormData).get('archivo')).toEqual(archivo);
  });

  it('con 404 devuelve undefined y propaga los demás errores', () => {
    const resultados: unknown[] = [];
    const observador = {
      next: (negocio: unknown) => resultados.push(negocio),
      error: (error: { status: number }) => resultados.push(error.status),
    };

    for (const status of [404, 500]) {
      servicio.obtenerActual().subscribe(observador);
      http.expectOne(`${URL_TOSTADORES}/actual`).flush(null, { status, statusText: 'Error' });
    }
    expect(resultados).toEqual([undefined, 500]);
  });
});
