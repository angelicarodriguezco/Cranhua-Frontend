import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { CuentaResponseApi } from '../models/auth.model';
import { AuthService } from './auth.service';
import { CuentaService } from './cuenta.service';
import { SesionService } from './sesion.service';

describe('AuthService', () => {
  let servicio: AuthService;
  let http: HttpTestingController;
  let cuentaService: CuentaService;
  let sesionService: SesionService;

  const cuentaApi: CuentaResponseApi = {
    id: 'uuid-1',
    nombreCompleto: 'Rodrigo Vargas Mora',
    correo: 'rodrigo@fincalacatalina.cr',
    roles: ['CAFETALERO', 'CAFETERIA'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    cuentaService = TestBed.inject(CuentaService);
    sesionService = TestBed.inject(SesionService);
  });

  afterEach(() => {
    http.verify();
  });

  it('POST /api/auth/registro con withCredentials', () => {
    let respuesta: CuentaResponseApi | undefined;
    servicio
      .registrar({
        nombreCompleto: 'Rodrigo Vargas Mora',
        correo: 'rodrigo@fincalacatalina.cr',
        contrasena: 'Cafe2026!',
        roles: ['CAFETALERO'],
        telefono: '+506 8888-0000',
      })
      .subscribe((r) => (respuesta = r));

    const req = http.expectOne(`${environment.apiUrl}/api/auth/registro`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(cuentaApi);
    expect(respuesta).toEqual(cuentaApi);
  });

  it('POST /api/auth/registro/google con withCredentials', () => {
    servicio.registrarConGoogle({ credencial: 'token-google', roles: ['TOSTADOR'] }).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/api/auth/registro/google`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ credencial: 'token-google', roles: ['TOSTADOR'] });
    expect(req.request.withCredentials).toBeTrue();
    req.flush(cuentaApi);
  });

  it('POST /api/auth/iniciarSesion con withCredentials', () => {
    let respuesta: CuentaResponseApi | undefined;
    servicio
      .iniciarSesion({ correo: 'rodrigo@fincalacatalina.cr', contrasena: 'Cafe2026!' })
      .subscribe((r) => (respuesta = r));

    const req = http.expectOne(`${environment.apiUrl}/api/auth/iniciarSesion`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      correo: 'rodrigo@fincalacatalina.cr',
      contrasena: 'Cafe2026!',
    });
    expect(req.request.withCredentials).toBeTrue();
    req.flush(cuentaApi);
    expect(respuesta).toEqual(cuentaApi);
  });

  it('POST /api/auth/iniciarSesion/google con withCredentials', () => {
    servicio.iniciarSesionConGoogle({ credencial: 'token-google' }).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/api/auth/iniciarSesion/google`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ credencial: 'token-google' });
    expect(req.request.withCredentials).toBeTrue();
    req.flush(cuentaApi);
  });

  it('POST /api/auth/recuperar con el correo', () => {
    servicio.solicitarRecuperacion({ correo: 'rodrigo@fincalacatalina.cr' }).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/api/auth/recuperar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ correo: 'rodrigo@fincalacatalina.cr' });
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('POST /api/auth/verificarCodigo con correo y código', () => {
    servicio
      .verificarCodigo({ correo: 'rodrigo@fincalacatalina.cr', codigo: '123456' })
      .subscribe();

    const req = http.expectOne(`${environment.apiUrl}/api/auth/verificarCodigo`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ correo: 'rodrigo@fincalacatalina.cr', codigo: '123456' });
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('POST /api/auth/restablecer con withCredentials', () => {
    servicio
      .restablecerContrasena({
        correo: 'rodrigo@fincalacatalina.cr',
        codigo: '123456',
        contrasena: 'NuevaSegura1',
      })
      .subscribe();

    const req = http.expectOne(`${environment.apiUrl}/api/auth/restablecer`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      correo: 'rodrigo@fincalacatalina.cr',
      codigo: '123456',
      contrasena: 'NuevaSegura1',
    });
    expect(req.request.withCredentials).toBeTrue();
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('aplicarSesion hidrata CuentaService y SesionService', () => {
    servicio.aplicarSesion(cuentaApi);

    expect(cuentaService.cuenta()).toEqual({
      id: 'uuid-1',
      nombreCompleto: 'Rodrigo Vargas Mora',
      correo: 'rodrigo@fincalacatalina.cr',
      roles: ['cafetalero', 'cafeteria'],
    });
    expect(sesionService.usuario()).toEqual({
      id: 'uuid-1',
      nombre: 'Rodrigo',
      apellidos: 'Vargas Mora',
      correo: 'rodrigo@fincalacatalina.cr',
    });
  });
});
