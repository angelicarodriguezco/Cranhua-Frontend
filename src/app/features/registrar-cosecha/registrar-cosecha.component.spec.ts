import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { convertToParamMap, provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { EDICION_NO_DISPONIBLE } from '../../core/services/cosecha.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { cosechaApi } from '../../core/testing/cosechas-de-prueba';
import { PasoDatosCosechaComponent } from './components/paso-datos-cosecha/paso-datos-cosecha.component';
import { PasoSeleccionCatacionComponent } from './components/paso-seleccion-catacion/paso-seleccion-catacion.component';
import { RegistrarCosechaComponent } from './registrar-cosecha.component';
import { conSesionDeEjemplo } from '../../core/testing/sesion-de-ejemplo';

const COSECHAS = `${environment.apiUrl}/api/cosechas`;

describe('RegistrarCosechaComponent', () => {
  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  let fixture: ComponentFixture<RegistrarCosechaComponent>;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  async function crearComponente(id: string | null = null): Promise<void> {
    TestBed.resetTestingModule();
    const paramMap = convertToParamMap(id ? { id } : {});

    await TestBed.configureTestingModule({
      imports: [RegistrarCosechaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(paramMap),
            snapshot: { paramMap },
          },
        },
      ],
    }).compileComponents();

    conSesionDeEjemplo();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RegistrarCosechaComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  }

  function guardarBoton(): HTMLButtonElement {
    return pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  }

  function completarPaso1(): void {
    const paso1 = fixture.debugElement.query(By.directive(PasoDatosCosechaComponent))
      .componentInstance as PasoDatosCosechaComponent;

    paso1['formulario'].patchValue({
      fincaId: 'f-1',
      variedad: 'Caturra',
      alturaMsnm: 1650,
      cantidadTotalKg: 120,
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-10',
    });
    paso1['formulario'].controls.procesos.at(0).patchValue({
      proceso: 'Honey',
      porcentaje: 100,
    });
    fixture.detectChanges();
    guardarBoton().click();
    fixture.detectChanges();
  }

  function completarPaso2(): void {
    const paso2 = fixture.debugElement.query(By.directive(PasoSeleccionCatacionComponent))
      .componentInstance as PasoSeleccionCatacionComponent;
    paso2['formulario'].patchValue({
      pesoAntesKg: 120,
      pesoTrasSeleccionKg: 96,
      precioKg: 4500,
    });
    fixture.detectChanges();
    guardarBoton().click();
    fixture.detectChanges();
  }

  function responderPost(cuerpo: object, status = 201): void {
    http
      .expectOne(COSECHAS)
      .flush(cuerpo, { status, statusText: status === 201 ? 'Created' : 'Error' });
    fixture.detectChanges();
  }

  it('muestra el menú del cafetalero y el título de registro', async () => {
    await crearComponente();

    expect(pagina.querySelector('nav')?.textContent).toContain('Registrar cosecha');
    expect(pagina.querySelector('.perfil-nombre')?.textContent).toBe('Rodrigo Alvarado');
    expect(pagina.querySelector('.encabezado__titulo')?.textContent).toBe('Registrar cosecha');
    expect(pagina.querySelector('.encabezado__texto')?.textContent).toContain(
      'Paso 1 de 2 — Datos de la cosecha y reparto por proceso.',
    );
  });

  it('actualiza el subtítulo al avanzar al paso 2, donde va el precio', async () => {
    await crearComponente();
    completarPaso1();

    expect(fixture.componentInstance['paso']()).toBe('seleccion');
    expect(pagina.querySelector('.encabezado__texto')?.textContent).toContain(
      'Paso 2 de 2 — Selección final, catación y precio.',
    );
    expect(pagina.querySelector('#cosecha-precio')).toBeTruthy();

    const paso2 = fixture.debugElement.query(By.directive(PasoSeleccionCatacionComponent))
      .componentInstance as PasoSeleccionCatacionComponent;
    expect(paso2['formulario'].controls.pesoAntesKg.value).toBe(120);
  });

  it('no avanza de paso si los porcentajes no suman 100', async () => {
    await crearComponente();
    const paso1 = fixture.debugElement.query(By.directive(PasoDatosCosechaComponent))
      .componentInstance as PasoDatosCosechaComponent;
    paso1['formulario'].controls.procesos.at(0).patchValue({ porcentaje: 40 });
    fixture.detectChanges();

    guardarBoton().click();
    fixture.detectChanges();

    expect(fixture.componentInstance['paso']()).toBe('datos');
  });

  it('mientras guarda deshabilita el botón y al responder muestra el resumen real', async () => {
    await crearComponente();
    completarPaso1();
    completarPaso2();

    expect(guardarBoton().disabled).toBeTrue();
    expect(guardarBoton().textContent?.trim()).toBe('Guardando…');

    responderPost(cosechaApi({ variedad: 'Caturra', fincaNombre: 'Finca El Tucán' }));

    expect(fixture.componentInstance['paso']()).toBe('exito');
    expect(pagina.querySelector('.encabezado')).toBeNull();
    expect(pagina.textContent).toContain('¡Cosecha registrada!');
    expect(pagina.textContent).toContain('Finca El Tucán');
    expect(pagina.textContent?.replace(/\s/g, ' ')).toContain('₡4 500');
  });

  it('muestra un error del servidor en su campo y se queda en el paso 2', async () => {
    await crearComponente();
    completarPaso1();
    completarPaso2();

    responderPost(
      {
        mensaje: 'Revisá los datos ingresados.',
        errores: { caracolilloKg: 'Ingresá primero el peso tras la selección.' },
      },
      400,
    );

    expect(fixture.componentInstance['paso']()).toBe('seleccion');
    expect(guardarBoton().disabled).toBeFalse();
    expect(pagina.querySelector('.error-general')).toBeNull();
    expect(fixture.componentInstance['erroresServidor']()).toEqual({
      pesoCaracolilloKg: 'Ingresá primero el peso tras la selección.',
    });
  });

  it('vuelve al paso 1 si el primer error es de ese paso', async () => {
    await crearComponente();
    completarPaso1();
    completarPaso2();

    responderPost(
      {
        mensaje: 'Revisá los datos ingresados.',
        errores: {
          fechaFin: 'La fecha de fin no puede ser antes de la de inicio.',
          precioKg: 'El precio por kg tiene que ser mayor a 0.',
        },
      },
      400,
    );

    expect(fixture.componentInstance['paso']()).toBe('datos');
    expect(pagina.querySelector('#cosecha-fin')?.parentElement?.textContent).toContain(
      'La fecha de fin no puede ser antes de la de inicio.',
    );
  });

  it('un 403 o 404 se muestra como mensaje general', async () => {
    await crearComponente();
    completarPaso1();
    completarPaso2();

    responderPost({ mensaje: 'Solo un dueño de la finca puede registrar cosechas en ella.' }, 403);

    expect(pagina.querySelector('.error-general')?.textContent).toContain(
      'Solo un dueño de la finca puede registrar cosechas en ella.',
    );
    expect(fixture.componentInstance['paso']()).toBe('seleccion');
  });

  it('"Ver cosecha" abre la finca con la cosecha resaltada', async () => {
    await crearComponente();
    completarPaso1();
    completarPaso2();
    responderPost(cosechaApi({ id: 'c-77', fincaId: 'f-9' }));
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    [...pagina.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.includes('Ver cosecha'))!
      .click();

    expect(navegar).toHaveBeenCalledWith(['/cafetalero/fincas', 'f-9'], {
      queryParams: { cosecha: 'c-77' },
    });
  });

  it('"Registrar otra" vuelve al paso 1 vacío', async () => {
    await crearComponente();
    completarPaso1();
    completarPaso2();
    responderPost(cosechaApi());
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    [...pagina.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.includes('Registrar otra cosecha'))!
      .click();
    fixture.detectChanges();

    expect(fixture.componentInstance['paso']()).toBe('datos');
    expect(pagina.querySelector<HTMLSelectElement>('#cosecha-variedad')?.value).toBe('');
  });

  it('en edición carga la cosecha real y muestra la zona de peligro', async () => {
    await crearComponente('c-1');
    const peticion = http.expectOne(`${COSECHAS}/c-1`);
    expect(peticion.request.withCredentials).toBeTrue();
    peticion.flush(cosechaApi({ variedad: 'Caturra' }));
    fixture.detectChanges();

    expect(pagina.querySelector('.encabezado__titulo')?.textContent).toBe('Editar cosecha');
    expect(pagina.querySelector<HTMLSelectElement>('#cosecha-variedad')?.value).toBe('Caturra');
    expect(pagina.textContent).toContain('Repartiste el 100%');
    expect(pagina.querySelector('app-zona-peligro')).toBeTruthy();
  });

  it('en edición, guardar avisa que todavía no está disponible', async () => {
    await crearComponente('c-1');
    http.expectOne(`${COSECHAS}/c-1`).flush(cosechaApi());
    fixture.detectChanges();

    guardarBoton().click();
    fixture.detectChanges();
    guardarBoton().click();
    fixture.detectChanges();

    expect(pagina.querySelector('.error-general')?.textContent).toContain(EDICION_NO_DISPONIBLE);
    expect(fixture.componentInstance['paso']()).toBe('seleccion');
  });

  it('en edición, eliminar avisa que todavía no está disponible y no navega', async () => {
    await crearComponente('c-1');
    http.expectOne(`${COSECHAS}/c-1`).flush(cosechaApi({ codigoLote: 'CRH-2026-0007' }));
    fixture.detectChanges();
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    pagina.querySelector<HTMLButtonElement>('app-zona-peligro button')!.click();
    fixture.detectChanges();
    expect(pagina.querySelector('.modal__titulo')?.textContent).toBe('¿Eliminar cosecha Geisha?');
    expect(pagina.querySelector('.modal__aviso')?.textContent).toContain('CRH-2026-0007');

    pagina.querySelector<HTMLButtonElement>('.modal__btn--peligro')!.click();
    fixture.detectChanges();

    expect(navegar).not.toHaveBeenCalled();
    expect(pagina.querySelector('app-modal-confirmacion')).toBeNull();
    expect(pagina.querySelector('.error-general')?.textContent).toContain(EDICION_NO_DISPONIBLE);
  });

  it('si la cosecha a editar no existe muestra el mensaje del backend', async () => {
    await crearComponente('c-x');
    http
      .expectOne(`${COSECHAS}/c-x`)
      .flush({ mensaje: 'No encontramos esa cosecha.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(pagina.querySelector('.error-general')?.textContent).toContain(
      'No encontramos esa cosecha.',
    );
  });

  it('aplica tokens de marca en tema claro y oscuro', async () => {
    await crearComponente();

    expect(pagina.getAttribute('data-theme')).toBe('claro');
    let estilos = getComputedStyle(pagina);
    expect(estilos.getPropertyValue('--vidrio-fondo').trim()).toBe('#f6f0e7');
    expect(estilos.getPropertyValue('--vidrio-texto').trim()).toBe('#292b27');
    expect(estilos.getPropertyValue('--vidrio-dorado').trim()).toBe('#a57008');
    expect(estilos.getPropertyValue('--vidrio-dorado-claro').trim()).toBe('#a57008');
    expect(estilos.getPropertyValue('--vidrio-exito').trim()).toBe('#1c3426');
    expect(estilos.getPropertyValue('--vidrio-merma-texto').trim()).toBe('#6d320a');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();

    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
    estilos = getComputedStyle(pagina);
    expect(estilos.getPropertyValue('--vidrio-fondo').trim()).toContain('color-mix');
    expect(estilos.getPropertyValue('--vidrio-texto').trim()).toBe('#f6f0e7');
    expect(estilos.getPropertyValue('--vidrio-dorado').trim()).toBe('#a57008');
    expect(estilos.getPropertyValue('--vidrio-dorado-claro').trim()).toBe('#b88410');
    expect(estilos.getPropertyValue('--vidrio-exito').trim()).toBe('#b88410');
    expect(estilos.getPropertyValue('--vidrio-merma-texto').trim()).toBe('#b88410');
  });
});
