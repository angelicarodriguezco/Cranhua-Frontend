import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DetalleCosechaDisponibleApi } from '../../core/models/detalle-cosecha.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { DetalleCosechaComponent } from './detalle-cosecha.component';

const BASE_DETALLE = `${environment.apiUrl}/api/cosechas/disponibles`;
const BASE_SOLICITUDES = `${environment.apiUrl}/api/solicitudes`;

const DETALLE: DetalleCosechaDisponibleApi = {
  id: 'cosecha-caturra-catalina',
  fincaId: 'f-1',
  finca: 'La Catalina',
  zona: 'Tarrazú',
  canton: 'Tarrazú',
  provincia: 'San José',
  variedad: 'Caturra',
  proceso: 'Red honey',
  notas: ['Jazmín', 'Panela'],
  precioKg: 5800,
  procesos: [{ proceso: 'Red honey', porcentaje: 100 }],
  alturaMsnm: 1650,
  kgDisponibles: 320,
  puntajeSca: null,
  codigoLote: null,
  productores: [
    {
      id: 'u-1',
      nombreCompleto: 'Rodrigo Solís Ureña',
      correo: 'rodrigo@ejemplo.cr',
      telefono: null,
    },
  ],
};

describe('DetalleCosechaComponent', () => {
  let fixture: ComponentFixture<DetalleCosechaComponent>;
  let elemento: HTMLElement;
  let http: HttpTestingController;

  function crear(id: string): void {
    TestBed.configureTestingModule({
      imports: [DetalleCosechaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id })) } },
        { provide: CafeteriaService, useValue: { obtenerActual: () => of(undefined) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DetalleCosechaComponent);
    elemento = fixture.nativeElement;
    fixture.detectChanges();
  }

  function responderDetalle(
    cuerpo: DetalleCosechaDisponibleApi | object,
    status = 200,
  ): void {
    const peticion = http.expectOne(`${BASE_DETALLE}/${DETALLE.id}`);
    if (status === 200) {
      peticion.flush(cuerpo);
    } else {
      peticion.flush(cuerpo, { status, statusText: 'Error' });
    }
    fixture.detectChanges();
  }

  function escribirCantidad(valor: string): void {
    const input = elemento.querySelector<HTMLInputElement>('#cantidad')!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  afterEach(() => http?.verify());

  it('muestra los datos de la cosecha y del productor', () => {
    crear(DETALLE.id);
    expect(elemento.textContent).toContain('Cargando cosecha…');
    responderDetalle(DETALLE);

    const texto = elemento.textContent ?? '';
    expect(texto).toContain('Finca La Catalina · Caturra');
    expect(texto).toContain('Rodrigo Solís');
    expect(texto).toContain('1650 msnm');
    expect(texto).toContain('320 kg');
    expect(texto).toContain('Jazmín');
  });

  it('calcula el total estimado con la cantidad y el precio por kg', () => {
    crear(DETALLE.id);
    responderDetalle(DETALLE);
    escribirCantidad('10');
    expect(elemento.querySelector('.total dd')?.textContent?.replace(/\D/g, '')).toBe('58000');
  });

  it('no deja pedir más de lo disponible', () => {
    crear(DETALLE.id);
    responderDetalle(DETALLE);
    const navegar = spyOn(TestBed.inject(Router), 'navigate');
    escribirCantidad('500');

    expect(elemento.querySelector('.error')?.textContent).toContain('Solo hay 320 kg');
    elemento.querySelector<HTMLButtonElement>('.boton-principal')!.click();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('al enviar una cantidad válida navega a Mis solicitudes', () => {
    crear(DETALLE.id);
    responderDetalle(DETALLE);
    const navegar = spyOn(TestBed.inject(Router), 'navigate');
    escribirCantidad('20');

    elemento.querySelector<HTMLButtonElement>('.boton-principal')!.click();
    fixture.detectChanges();

    const peticion = http.expectOne(BASE_SOLICITUDES);
    expect(peticion.request.body).toEqual({
      cosechaId: DETALLE.id,
      cantidadKg: 20,
    });
    peticion.flush({
      id: 's-1',
      cosechaId: DETALLE.id,
      cantidadKg: 20,
      precioKg: 5800,
      totalEstimado: 116000,
      estado: 'PENDIENTE',
      solicitadaEn: '2026-11-20T15:00:00.000Z',
      respondidaEn: null,
      codigoLote: null,
    });
    fixture.detectChanges();

    expect(navegar).toHaveBeenCalledWith(['/tostador/solicitudes']);
  });

  it('muestra el mensaje 400 del API en el formulario', () => {
    crear(DETALLE.id);
    responderDetalle(DETALLE);
    const navegar = spyOn(TestBed.inject(Router), 'navigate');
    escribirCantidad('20');

    elemento.querySelector<HTMLButtonElement>('.boton-principal')!.click();
    fixture.detectChanges();

    http.expectOne(BASE_SOLICITUDES).flush(
      {
        mensaje: 'No hay suficiente café disponible: pedís 20 kg',
        errores: { cantidadKg: 'No hay suficiente café disponible' },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(elemento.querySelector('.error')?.textContent).toContain(
      'No hay suficiente café disponible',
    );
    expect(navegar).not.toHaveBeenCalled();
  });

  it('el enlace Volver lleva a Explorar cosechas', () => {
    crear(DETALLE.id);
    responderDetalle(DETALLE);
    expect(elemento.querySelector('.volver')?.getAttribute('href')).toBe('/tostador/cosechas');
  });

  it('avisa si la cosecha no existe', () => {
    crear('no-existe');
    http
      .expectOne(`${BASE_DETALLE}/no-existe`)
      .flush({ mensaje: 'No encontrada' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(elemento.textContent).toContain('No encontramos esta cosecha.');
  });

  it('muestra error de carga si el API falla', () => {
    crear(DETALLE.id);
    http.expectOne(`${BASE_DETALLE}/${DETALLE.id}`).flush(
      { mensaje: 'No se pudo completar la solicitud. Intentá de nuevo.' },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();

    expect(elemento.textContent).toContain('No se pudo completar la solicitud');
  });
});
