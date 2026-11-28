import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Cosecha, ErrorCosecha, NuevaCosecha } from '../models/cosecha.model';
import { cosechaApi } from '../testing/cosechas-de-prueba';
import { cosechaDesdeApi, erroresEnFormulario } from '../utils/cosecha-desde-api';
import { CosechaService } from './cosecha.service';
import { DashboardCafetaleroService } from './dashboard-cafetalero.service';

const BASE = `${environment.apiUrl}/api/cosechas`;

function datosNueva(cambios: Partial<NuevaCosecha> = {}): NuevaCosecha {
  return {
    fincaId: 'f-1',
    variedad: 'Geisha',
    alturaMsnm: 1650,
    cantidadTotalKg: 1000,
    fechaInicio: '2026-01-10',
    fechaFin: '2026-03-15',
    procesos: [{ proceso: 'Lavado', porcentaje: 100 }],
    pesoAntesKg: 800,
    pesoTrasSeleccionKg: 720,
    separoCaracolillo: true,
    pesoCaracolilloKg: 40,
    puntajeSca: 88.25,
    notasCatacion: 'Jazmín y durazno',
    precioKg: 4500,
    ...cambios,
  };
}

function datosEdicion(): Omit<NuevaCosecha, 'fincaId'> {
  const datos: Partial<NuevaCosecha> = datosNueva();
  delete datos.fincaId;
  return datos as Omit<NuevaCosecha, 'fincaId'>;
}

describe('CosechaService', () => {
  let servicio: CosechaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(CosechaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('registrar manda el cuerpo con los nombres del backend y credenciales', () => {
    let creada: Cosecha | undefined;
    servicio.registrar(datosNueva()).subscribe((c) => (creada = c));

    const peticion = http.expectOne(BASE);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.withCredentials).toBeTrue();
    expect(peticion.request.body).toEqual({
      fincaId: 'f-1',
      variedad: 'Geisha',
      alturaMsnm: 1650,
      fechaInicio: '2026-01-10',
      fechaFin: '2026-03-15',
      procesos: [{ proceso: 'Lavado', porcentaje: 100 }],
      cantidadCosechadaKg: 1000,
      pesoTrasBeneficiadoKg: 800,
      pesoTrasSeleccionKg: 720,
      caracolilloKg: 40,
      notasSabor: 'Jazmín y durazno',
      puntajeSca: 88.25,
      precioKg: 4500,
    });
    peticion.flush(cosechaApi(), { status: 201, statusText: 'Created' });

    expect(creada?.id).toBe('c-1');
    expect(creada?.precioKg).toBe(4500);
  });

  it('manda caracolillo null cuando no se separó', () => {
    servicio.registrar(datosNueva({ separoCaracolillo: false, pesoCaracolilloKg: 12 })).subscribe();
    expect(http.expectOne(BASE).request.body.caracolilloKg).toBeNull();

    servicio.registrar(datosNueva({ separoCaracolillo: null, pesoCaracolilloKg: 12 })).subscribe();
    expect(http.expectOne(BASE).request.body.caracolilloKg).toBeNull();
  });

  it('al registrar actualiza las cosechas recientes del dashboard', () => {
    const dashboard = TestBed.inject(DashboardCafetaleroService);
    servicio.registrar(datosNueva()).subscribe();
    http.expectOne(BASE).flush(cosechaApi({ id: 'c-nueva' }));

    expect(dashboard.cosechasRecientes().find((c) => c.id === 'c-nueva')).toEqual(
      jasmine.objectContaining({
        finca: 'Finca La Catalina',
        proceso: 'Lavado',
        kgDisponibles: 720,
        estado: 'Borrador',
      }),
    );
  });

  it('mapea la respuesta: estado, proceso principal y nombres del formulario', () => {
    let cosecha: Cosecha | undefined;
    servicio.obtener('c-1').subscribe((c) => (cosecha = c));
    const peticion = http.expectOne(`${BASE}/c-1`);
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush(cosechaApi());

    expect(cosecha).toEqual(
      jasmine.objectContaining({
        estado: 'Borrador',
        proceso: 'Lavado',
        fincaNombre: 'Finca La Catalina',
        cantidadTotalKg: 1000,
        pesoAntesKg: 800,
        separoCaracolillo: true,
        pesoCaracolilloKg: 40,
        notasCatacion: 'Jazmín y durazno',
        mermaSeleccionPorcentaje: 10,
      }),
    );
  });

  it('deFinca trae las cosechas aunque falten pesos y nombre de finca', () => {
    let cosechas: Cosecha[] = [];
    servicio.deFinca('f-1').subscribe((lista) => (cosechas = lista));
    const peticion = http.expectOne(`${environment.apiUrl}/api/fincas/f-1/cosechas`);
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush([
      cosechaApi({
        estado: 'BORRADOR',
        pesoTrasSeleccionKg: null,
        caracolilloKg: null,
        kgDisponibles: null,
        fincaNombre: undefined,
      }),
    ]);

    expect(cosechas[0].estado).toBe('Borrador');
    expect(cosechas[0].kgDisponibles).toBeNull();
    expect(cosechas[0].separoCaracolillo).toBeNull();
    expect(cosechas[0].fincaNombre).toBeNull();
  });

  it('un 400 devuelve el mensaje y los errores por campo', () => {
    let error: ErrorCosecha | undefined;
    servicio.registrar(datosNueva()).subscribe({ error: (e) => (error = e) });
    http.expectOne(BASE).flush(
      {
        mensaje: 'Revisá los datos ingresados.',
        errores: { precioKg: 'El precio por kg tiene que ser mayor a 0.' },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(error).toEqual({
      mensaje: 'Revisá los datos ingresados.',
      errores: { precioKg: 'El precio por kg tiene que ser mayor a 0.' },
    });
  });

  it('un 403 trae solo el mensaje y un error de red usa el genérico', () => {
    const errores: ErrorCosecha[] = [];
    servicio.registrar(datosNueva()).subscribe({ error: (e) => errores.push(e) });
    http
      .expectOne(BASE)
      .flush(
        { mensaje: 'Solo un dueño de la finca puede registrar cosechas en ella.' },
        { status: 403, statusText: 'Forbidden' },
      );
    servicio.registrar(datosNueva()).subscribe({ error: (e) => errores.push(e) });
    http.expectOne(BASE).error(new ProgressEvent('error'));

    expect(errores).toEqual([
      { mensaje: 'Solo un dueño de la finca puede registrar cosechas en ella.', errores: {} },
      { mensaje: 'No pudimos registrar la cosecha. Intentá de nuevo.', errores: {} },
    ]);
  });

  it('cosechaDesdeApi convierte los tres estados del backend', () => {
    expect(cosechaDesdeApi(cosechaApi({ estado: 'BORRADOR' })).estado).toBe('Borrador');
    expect(cosechaDesdeApi(cosechaApi({ estado: 'PUBLICADA' })).estado).toBe('Publicada');
    expect(cosechaDesdeApi(cosechaApi({ estado: 'AGOTADA' })).estado).toBe('Agotada');
  });

  it('cambiarEstado hace PATCH con el estado y credenciales', () => {
    let cosecha: Cosecha | undefined;
    servicio.cambiarEstado('c-1', 'PUBLICADA').subscribe((c) => (cosecha = c));
    const peticion = http.expectOne(`${BASE}/c-1/estado`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.withCredentials).toBeTrue();
    expect(peticion.request.body).toEqual({ estado: 'PUBLICADA' });
    peticion.flush(cosechaApi({ estado: 'PUBLICADA' }));
    expect(cosecha?.estado).toBe('Publicada');

    servicio.cambiarEstado('c-1', 'BORRADOR').subscribe((c) => (cosecha = c));
    const retiro = http.expectOne(`${BASE}/c-1/estado`);
    expect(retiro.request.body).toEqual({ estado: 'BORRADOR' });
    retiro.flush(cosechaApi({ estado: 'BORRADOR' }));
    expect(cosecha?.estado).toBe('Borrador');
  });

  it('cambiarEstado actualiza la cosecha en el dashboard', () => {
    const dashboard = TestBed.inject(DashboardCafetaleroService);
    servicio.cambiarEstado('c-1', 'PUBLICADA').subscribe();
    http.expectOne(`${BASE}/c-1/estado`).flush(cosechaApi({ estado: 'PUBLICADA' }));
    expect(dashboard.cosechasRecientes().find((c) => c.id === 'c-1')?.estado).toBe('Publicada');
  });

  it('cambiarEstado devuelve los errores del backend como ErrorCosecha', () => {
    const errores: ErrorCosecha[] = [];
    const fallar = (status: number, statusText: string, mensaje: string) => {
      servicio.cambiarEstado('c-1', 'PUBLICADA').subscribe({ error: (e) => errores.push(e) });
      http.expectOne(`${BASE}/c-1/estado`).flush({ mensaje }, { status, statusText });
    };
    fallar(400, 'Bad Request', 'Solo se puede publicar una cosecha en borrador.');
    fallar(403, 'Forbidden', 'Solo un dueño de la finca puede cambiar el estado.');
    fallar(404, 'Not Found', 'No encontramos la cosecha.');
    servicio.cambiarEstado('c-1', 'BORRADOR').subscribe({ error: (e) => errores.push(e) });
    http.expectOne(`${BASE}/c-1/estado`).error(new ProgressEvent('error'));

    expect(errores).toEqual([
      { mensaje: 'Solo se puede publicar una cosecha en borrador.', errores: {} },
      { mensaje: 'Solo un dueño de la finca puede cambiar el estado.', errores: {} },
      { mensaje: 'No encontramos la cosecha.', errores: {} },
      { mensaje: 'No pudimos cambiar el estado de la cosecha. Intentá de nuevo.', errores: {} },
    ]);
  });

  it('actualizar hace PATCH con el mismo cuerpo de registrar pero sin fincaId', () => {
    const datos = datosEdicion();
    let guardada: Cosecha | undefined;
    servicio.actualizar('c-1', datos).subscribe((c) => (guardada = c));

    const peticion = http.expectOne(`${BASE}/c-1`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.withCredentials).toBeTrue();
    expect(peticion.request.body).toEqual({
      variedad: 'Geisha',
      alturaMsnm: 1650,
      fechaInicio: '2026-01-10',
      fechaFin: '2026-03-15',
      procesos: [{ proceso: 'Lavado', porcentaje: 100 }],
      cantidadCosechadaKg: 1000,
      pesoTrasBeneficiadoKg: 800,
      pesoTrasSeleccionKg: 720,
      caracolilloKg: 40,
      notasSabor: 'Jazmín y durazno',
      puntajeSca: 88.25,
      precioKg: 4500,
    });
    peticion.flush(cosechaApi({ id: 'c-1' }));
    expect(guardada?.id).toBe('c-1');
  });

  it('actualizar devuelve los errores 400, 409 y 404 con su estado', () => {
    const datos = datosEdicion();
    const errores: ErrorCosecha[] = [];
    const fallar = (status: number, cuerpo: object) => {
      servicio.actualizar('c-1', datos).subscribe({ error: (e) => errores.push(e) });
      http.expectOne(`${BASE}/c-1`).flush(cuerpo, { status, statusText: '' });
    };
    const bloqueado = 'No se puede cambiar porque ya está en códigos impresos.';
    fallar(400, {
      mensaje: 'Revisá los datos ingresados.',
      errores: { precioKg: 'El precio debe ser mayor a 0.' },
    });
    fallar(409, {
      mensaje:
        'Esta cosecha ya tiene lotes comprados. Solo podés cambiar el precio y las notas de sabor.',
      errores: { variedad: bloqueado },
    });
    fallar(404, { mensaje: 'No encontramos esa cosecha.' });

    expect(errores).toEqual([
      {
        mensaje: 'Revisá los datos ingresados.',
        errores: { precioKg: 'El precio debe ser mayor a 0.' },
        estado: 400,
      },
      {
        mensaje:
          'Esta cosecha ya tiene lotes comprados. Solo podés cambiar el precio y las notas de sabor.',
        errores: { variedad: bloqueado },
        estado: 409,
      },
      { mensaje: 'No encontramos esa cosecha.', errores: {}, estado: 404 },
    ]);
  });

  it('eliminar hace DELETE y la saca del dashboard', () => {
    const dashboard = TestBed.inject(DashboardCafetaleroService);
    servicio.cambiarEstado('c-1', 'PUBLICADA').subscribe();
    http.expectOne(`${BASE}/c-1/estado`).flush(cosechaApi({ id: 'c-1' }));

    let terminado = false;
    servicio.eliminar('c-1').subscribe(() => (terminado = true));
    const peticion = http.expectOne(`${BASE}/c-1`);
    expect(peticion.request.method).toBe('DELETE');
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush(null, { status: 204, statusText: 'No Content' });

    expect(terminado).toBeTrue();
    expect(dashboard.cosechasRecientes().some((c) => c.id === 'c-1')).toBeFalse();
  });

  it('eliminar con lotes devuelve el 409 del backend', () => {
    const mensaje =
      'No podés eliminar esta cosecha porque ya tiene lotes comprados con código de trazabilidad. Si no querés recibir más solicitudes, retirala.';
    let error: ErrorCosecha | undefined;
    servicio.eliminar('c-1').subscribe({ error: (e) => (error = e) });
    http.expectOne(`${BASE}/c-1`).flush({ mensaje }, { status: 409, statusText: 'Conflict' });

    expect(error).toEqual({ mensaje, errores: {}, estado: 409 });
  });

  it('erroresEnFormulario pasa los campos del backend a los del formulario', () => {
    expect(
      erroresEnFormulario({
        cantidadCosechadaKg: 'a',
        pesoTrasBeneficiadoKg: 'b',
        caracolilloKg: 'c',
        notasSabor: 'd',
        'procesos[1].porcentaje': 'e',
        precioKg: 'f',
      }),
    ).toEqual({
      cantidadTotalKg: 'a',
      pesoAntesKg: 'b',
      pesoCaracolilloKg: 'c',
      notasCatacion: 'd',
      procesos: 'e',
      precioKg: 'f',
    });
  });
});
