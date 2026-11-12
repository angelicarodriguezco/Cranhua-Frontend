import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';

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

  it('POST /api/auth/registro JSON sin foto con withCredentials', () => {
    const body = {
      nombreCompleto: 'Rodrigo Vargas Mora',
      correo: 'rodrigo@fincalacatalina.cr',
      contrasena: 'Cafe2026!',
      roles: ['CAFETALERO'] as const,
      telefono: '+506 8888-0000',
    };
    let respuesta: CuentaResponseApi | undefined;
    servicio.registrar({ ...body, roles: [...body.roles] }).subscribe((r) => (respuesta = r));

    const req = http.expectOne(`${environment.apiUrl}/api/auth/registro`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual({ ...body, roles: [...body.roles] });
    expect(req.request.body instanceof FormData).toBeFalse();
    req.flush(cuentaApi);
    expect(respuesta).toEqual(cuentaApi);
  });

  it('POST /api/auth/registro multipart con foto y withCredentials', async () => {
    const request = {
      nombreCompleto: 'Rodrigo Vargas Mora',
      correo: 'rodrigo@fincalacatalina.cr',
      contrasena: 'Cafe2026!',
      roles: ['CAFETALERO'] as const,
      telefono: '+506 8888-0000',
    };
    const foto = new File([new Uint8Array([1, 2, 3])], 'avatar.png', { type: 'image/png' });
    let respuesta: CuentaResponseApi | undefined;

    servicio
      .registrar({ ...request, roles: [...request.roles] }, foto)
      .subscribe((r) => (respuesta = r));

    const req = http.expectOne(`${environment.apiUrl}/api/auth/registro`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body instanceof FormData).toBeTrue();

    const formData = req.request.body as FormData;
    expect(formData.get('foto')).toBe(foto);
    const datos = formData.get('datos') as Blob;
    expect(datos).toEqual(jasmine.any(Blob));
    expect(datos.type).toBe('application/json');
    expect(JSON.parse(await datos.text())).toEqual({ ...request, roles: [...request.roles] });

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
    expect(req.request.responseType).toBe('text');
    req.flush('', { status: 204, statusText: 'No Content' });
  });

  it('POST /api/auth/verificarCodigo con correo y código', () => {
    servicio
      .verificarCodigo({ correo: 'rodrigo@fincalacatalina.cr', codigo: '123456' })
      .subscribe();

    const req = http.expectOne(`${environment.apiUrl}/api/auth/verificarCodigo`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ correo: 'rodrigo@fincalacatalina.cr', codigo: '123456' });
    expect(req.request.responseType).toBe('text');
    req.flush('', { status: 204, statusText: 'No Content' });
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
    expect(req.request.responseType).toBe('text');
    req.flush('', { status: 204, statusText: 'No Content' });
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

  describe('restaurarSesion', () => {
    const urlCuenta = `${environment.apiUrl}/api/cuenta`;

    it('con 200 hidrata la cuenta y la sesión', async () => {
      const promesa = servicio.restaurarSesion();
      const req = http.expectOne(urlCuenta);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBeTrue();
      req.flush(cuentaApi);
      await promesa;

      expect(cuentaService.cuenta()?.id).toBe('uuid-1');
      expect(sesionService.usuario()?.id).toBe('uuid-1');
    });

    it('con 401 deja la cuenta y la sesión en null', async () => {
      const promesa = servicio.restaurarSesion();
      http.expectOne(urlCuenta).flush(null, { status: 401, statusText: 'Unauthorized' });
      await promesa;

      expect(cuentaService.cuenta()).toBeNull();
      expect(sesionService.usuario()).toBeNull();
    });

    it('sin red no cambia nada y la promesa resuelve', async () => {
      const cuentaAntes = cuentaService.cuenta();
      const usuarioAntes = sesionService.usuario();

      const promesa = servicio.restaurarSesion();
      http.expectOne(urlCuenta).error(new ProgressEvent('error'));
      await expectAsync(promesa).toBeResolved();

      expect(cuentaService.cuenta()).toBe(cuentaAntes);
      expect(sesionService.usuario()).toBe(usuarioAntes);
    });

    it('si el backend no responde en 5 s resuelve sin cambiar nada', fakeAsync(() => {
      const cuentaAntes = cuentaService.cuenta();
      const usuarioAntes = sesionService.usuario();
      let resuelta = false;

      servicio.restaurarSesion().then(() => (resuelta = true));
      const req = http.expectOne(urlCuenta);
      tick(5000);
      flushMicrotasks();

      expect(resuelta).toBeTrue();
      expect(req.cancelled).toBeTrue();
      expect(cuentaService.cuenta()).toBe(cuentaAntes);
      expect(sesionService.usuario()).toBe(usuarioAntes);
    }));
  });

  describe('cerrarSesion', () => {
    const urlCerrar = `${environment.apiUrl}/api/auth/cerrarSesion`;

    it('limpia la sesión y hace POST /api/auth/cerrarSesion con withCredentials', () => {
      servicio.cerrarSesion();

      expect(cuentaService.cuenta()).toBeNull();
      expect(sesionService.usuario()).toBeNull();
      const req = http.expectOne(urlCerrar);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBeTrue();
      req.flush('', { status: 204, statusText: 'No Content' });
    });

    it('si el backend falla no lanza excepción', () => {
      expect(() => {
        servicio.cerrarSesion();
        http.expectOne(urlCerrar).flush(null, { status: 500, statusText: 'Server Error' });
      }).not.toThrow();
      expect(sesionService.usuario()).toBeNull();
    });
  });
});
