import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Cosecha, ErrorCosecha, NuevaCosecha } from '../models/cosecha.model';
import { cosechaApi } from '../testing/cosechas-de-prueba';
import { erroresEnFormulario } from '../utils/cosecha-desde-api';
import { CosechaService, EDICION_NO_DISPONIBLE } from './cosecha.service';
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
        estado: 'Disponible',
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
        estado: 'Disponible',
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

  it('EN_BENEFICIADO se muestra como En beneficiado', () => {
    let cosechas: Cosecha[] = [];
    servicio.deFinca('f-1').subscribe((lista) => (cosechas = lista));
    const peticion = http.expectOne(`${environment.apiUrl}/api/fincas/f-1/cosechas`);
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush([
      cosechaApi({
        estado: 'EN_BENEFICIADO',
        pesoTrasSeleccionKg: null,
        caracolilloKg: null,
        kgDisponibles: null,
        fincaNombre: undefined,
      }),
    ]);

    expect(cosechas[0].estado).toBe('En beneficiado');
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

  it('editar y eliminar todavía no están disponibles', () => {
    const errores: ErrorCosecha[] = [];
    servicio.actualizar().subscribe({ error: (e) => errores.push(e) });
    servicio.eliminar().subscribe({ error: (e) => errores.push(e) });

    expect(errores.map((e) => e.mensaje)).toEqual([EDICION_NO_DISPONIBLE, EDICION_NO_DISPONIBLE]);
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
