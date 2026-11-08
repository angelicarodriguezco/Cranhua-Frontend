import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { CuentaResponseApi } from '../models/auth.model';
import { PerfilUsuario } from '../models/perfil.model';
import { PerfilService } from './perfil.service';

describe('PerfilService', () => {
  let servicio: PerfilService;
  let http: HttpTestingController;

  const cuentaApi: CuentaResponseApi = {
    id: 'uuid-1',
    nombreCompleto: 'Rodrigo Alvarado Castro',
    correo: 'rodrigo@fincalacatalina.cr',
    roles: ['CAFETALERO'],
    telefono: '+506 8888-4321',
    fotoUrl: null,
    redes: [
      { tipo: 'INSTAGRAM', valor: '@fincalacatalina' },
      { tipo: 'WHATSAPP', valor: '+506 8888-4321' },
    ],
  };

  const perfilEsperado: PerfilUsuario = {
    id: 'uuid-1',
    nombreCompleto: 'Rodrigo Alvarado Castro',
    correo: 'rodrigo@fincalacatalina.cr',
    telefono: '+506 8888-4321',
    roles: ['cafetalero'],
    redes: [
      { tipo: 'instagram', valor: '@fincalacatalina' },
      { tipo: 'whatsapp', valor: '+506 8888-4321' },
    ],
    portadaUrl: null,
    avatarUrl: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(PerfilService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('GET /api/cuenta con withCredentials y mapea a PerfilUsuario', () => {
    let perfil: PerfilUsuario | undefined;
    servicio.obtener().subscribe((r) => (perfil = r));

    const req = http.expectOne(`${environment.apiUrl}/api/cuenta`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(cuentaApi);
    expect(perfil).toEqual(perfilEsperado);
  });

  it('PATCH /api/cuenta envía nombreCompleto, telefono y redes sin fotoUrl', () => {
    let perfil: PerfilUsuario | undefined;
    servicio
      .actualizar({
        nombreCompleto: 'Rodrigo Alvarado',
        telefono: '+506 8888-9999',
        redes: [{ tipo: 'sitio', valor: 'https://finca.cr' }],
      })
      .subscribe((r) => (perfil = r));

    const req = http.expectOne(`${environment.apiUrl}/api/cuenta`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual({
      nombreCompleto: 'Rodrigo Alvarado',
      telefono: '+506 8888-9999',
      redes: [{ tipo: 'SITIO_WEB', valor: 'https://finca.cr' }],
    });
    expect(req.request.body.fotoUrl).toBeUndefined();

    const respuesta: CuentaResponseApi = {
      ...cuentaApi,
      nombreCompleto: 'Rodrigo Alvarado',
      telefono: '+506 8888-9999',
      redes: [{ tipo: 'SITIO_WEB', valor: 'https://finca.cr' }],
    };
    req.flush(respuesta);
    expect(perfil).toEqual({
      ...perfilEsperado,
      nombreCompleto: 'Rodrigo Alvarado',
      telefono: '+506 8888-9999',
      redes: [{ tipo: 'sitio', valor: 'https://finca.cr' }],
    });
  });

  it('PATCH mapea teléfono vacío a null', () => {
    servicio.actualizar({ telefono: '   ' }).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/api/cuenta`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ telefono: null });
    req.flush(cuentaApi);
  });

  it('DELETE /api/cuenta con withCredentials responde 204', () => {
    let completado = false;
    servicio.eliminarCuenta().subscribe({ complete: () => (completado = true) });

    const req = http.expectOne(`${environment.apiUrl}/api/cuenta`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(completado).toBeTrue();
  });
});
