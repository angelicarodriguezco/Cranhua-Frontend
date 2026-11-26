import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SolicitudesEnviadasResponseApi } from '../../core/models/solicitud.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { CLAVE_TEMA } from '../../core/services/tema.service';
import { conSesionDeEjemplo } from '../../core/testing/sesion-de-ejemplo';
import { MisSolicitudesComponent } from './mis-solicitudes.component';

const ENVIADAS = `${environment.apiUrl}/api/solicitudes/enviadas`;

const RESPUESTA: SolicitudesEnviadasResponseApi = {
  indicadores: { pendientes: 1, esteMes: 2, fincasContactadas: 1 },
  solicitudes: [
    {
      id: 's-1',
      cosechaId: 'c-1',
      fincaId: 'f-1',
      finca: 'Monte Alto',
      variedad: 'Geisha',
      codigoLote: 'LC-1',
      cantidadKg: 40,
      solicitadaEn: '2026-11-20T15:00:00.000Z',
      estado: 'PENDIENTE',
    },
    {
      id: 's-2',
      cosechaId: 'c-2',
      fincaId: 'f-1',
      finca: 'La Catalina',
      variedad: 'Caturra',
      codigoLote: null,
      cantidadKg: 20,
      solicitadaEn: '2026-11-10T12:00:00.000Z',
      estado: 'APROBADA',
    },
  ],
};

describe('MisSolicitudesComponent', () => {
  let fixture: ComponentFixture<MisSolicitudesComponent>;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisSolicitudesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CafeteriaService, useValue: { obtenerActual: () => of(undefined) } },
      ],
    }).compileComponents();

    conSesionDeEjemplo();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MisSolicitudesComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(CLAVE_TEMA);
  });

  function responder(cuerpo: SolicitudesEnviadasResponseApi | object, status = 200): void {
    const peticion = http.expectOne(ENVIADAS);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.withCredentials).toBeTrue();
    if (status === 200) {
      peticion.flush(cuerpo);
    } else {
      peticion.flush(cuerpo, { status, statusText: 'Error' });
    }
    fixture.detectChanges();
  }

  it('muestra carga y luego el historial con estados del API', () => {
    expect(pagina.textContent).toContain('Cargando solicitudes…');

    responder(RESPUESTA);

    expect(pagina.textContent).toContain('Solicitudes pendientes');
    expect(pagina.querySelector('.indicadores')?.textContent).toContain('1');
    const filas = [...pagina.querySelectorAll('tbody tr')];
    expect(filas).toHaveSize(2);
    expect(filas[0].textContent).toContain('Monte Alto');
    expect(filas[0].textContent).toContain('Pendiente');
    expect(filas[1].textContent).toContain('La Catalina');
    expect(filas[1].textContent).toContain('Aprobada');
  });

  it('muestra vacío cuando no hay solicitudes', () => {
    responder({
      indicadores: { pendientes: 0, esteMes: 0, fincasContactadas: 0 },
      solicitudes: [],
    });

    expect(pagina.textContent).toContain('Todavía no enviaste solicitudes.');
  });

  it('muestra error del API y permite reintentar', () => {
    responder({ mensaje: 'No se pudo completar la solicitud. Intentá de nuevo.' }, 500);

    expect(pagina.textContent).toContain('No se pudo completar la solicitud');

    pagina.querySelector<HTMLButtonElement>('button')!.click();
    fixture.detectChanges();
    expect(pagina.textContent).toContain('Cargando solicitudes…');

    responder({
      indicadores: { pendientes: 0, esteMes: 0, fincasContactadas: 0 },
      solicitudes: [],
    });
    expect(pagina.textContent).toContain('Todavía no enviaste solicitudes.');
  });

  it('Explorar cosechas lleva a la vista de cosechas del tostador', () => {
    responder(RESPUESTA);
    const enlace = fixture.debugElement.query(By.css('.encabezado a')).injector.get(RouterLink);
    expect(enlace.href).toBe('/tostador/cosechas');
  });
});
