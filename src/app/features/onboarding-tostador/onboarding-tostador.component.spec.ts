import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';

import { USUARIOS } from '../../core/mocks/finca.mock';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import {
  CLAVE_ONBOARDING_ROLES,
  OnboardingRolesService,
} from '../../core/services/onboarding-roles.service';
import { SesionService } from '../../core/services/sesion.service';
import { Coordenada } from '../../core/models/negocio-tueste.model';
import {
  OnboardingTostadorComponent,
  RUTA_DASHBOARD_TOSTADOR,
} from './onboarding-tostador.component';
import { conSesionDeEjemplo } from '../../core/testing/sesion-de-ejemplo';
import { responderCantones } from '../../core/testing/cantones-de-prueba';
import { NEGOCIO_API, URL_TOSTADORES } from '../../core/testing/negocio-tueste.fixture';

const TIBAS: Coordenada = { lat: 9.959, lng: -84.082 };
const OCEANO: Coordenada = { lat: 8.5, lng: -86.5 };

describe('OnboardingTostadorComponent', () => {
  let fixture: ComponentFixture<OnboardingTostadorComponent>;
  let componente: OnboardingTostadorComponent;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingTostadorComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
      ],
    }).compileComponents();

    conSesionDeEjemplo();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OnboardingTostadorComponent);
    responderCantones();
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    sessionStorage.removeItem(CLAVE_ONBOARDING_ROLES);
    TestBed.inject(OnboardingRolesService).limpiar();
  });

  function boton(texto: string): HTMLButtonElement {
    const encontrado = [...pagina.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(texto),
    );
    if (!encontrado) {
      throw new Error(`No hay botón "${texto}"`);
    }
    return encontrado;
  }

  function pasoActual(): string | null {
    return pagina.querySelector('.pasos')!.getAttribute('aria-label');
  }

  function clic(texto: string) {
    boton(texto).click();
    fixture.detectChanges();
  }

  function llenar() {
    componente['formulario'].patchValue({
      nombre: 'Tostaduría Volcán',
      contacto: 'Mariana Castro',
      telefono: '8888 1234',
      correo: 'contacto@volcan.cr',
    });
    componente['pin'].set(TIBAS);
    fixture.detectChanges();
    clic('Claro');
    clic('Medio');
  }

  function crearCuenta() {
    clic('Empezar a registrar');
    llenar();
    clic('Crear cuenta de tostador');
    const peticion = http.expectOne(URL_TOSTADORES);
    peticion.flush(NEGOCIO_API);
    fixture.detectChanges();
    return peticion.request;
  }

  it('da la bienvenida con el nombre de la sesión', () => {
    expect(pagina.textContent).toContain('Rodrigo');
    expect(pagina.querySelector('.avatar')?.textContent).toBe('R');
    expect(pasoActual()).toBe('Paso 1 de 3');

    TestBed.inject(SesionService).iniciarSesion(USUARIOS[1]);
    fixture.detectChanges();
    expect(pagina.textContent).toContain('María');
    expect(pagina.querySelector('.avatar')?.textContent).toBe('M');
  });

  it('pasa al formulario y vuelve a la bienvenida', () => {
    clic('Empezar a registrar');
    expect(pasoActual()).toBe('Paso 2 de 3');
    expect(pagina.textContent).toContain('Registrá tu negocio de tueste');

    clic('Volver');
    expect(pasoActual()).toBe('Paso 1 de 3');
  });

  it('al salir desde la bienvenida limpia la cola de roles', () => {
    const roles = TestBed.inject(OnboardingRolesService);
    roles.iniciar(['tostador', 'cafeteria']);
    fixture.detectChanges();
    expect(roles.hayCadena()).toBeTrue();
    expect(pagina.querySelector('.onboarding__progreso-roles')).not.toBeNull();

    const location = TestBed.inject(Location);
    spyOn(location, 'back');
    clic('Volver');

    expect(location.back).toHaveBeenCalled();
    expect(roles.hayCadena()).toBeFalse();
    expect(roles.siguienteRuta()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_ONBOARDING_ROLES)).toBeNull();
  });

  it('volver al paso anterior no limpia la cola de roles', () => {
    const roles = TestBed.inject(OnboardingRolesService);
    roles.iniciar(['tostador', 'cafeteria']);
    fixture.detectChanges();

    clic('Empezar a registrar');
    clic('Volver');

    expect(pasoActual()).toBe('Paso 1 de 3');
    expect(roles.hayCadena()).toBeTrue();
    expect(roles.siguienteRuta()).toBe('/onboarding-cafeteria');
  });

  it('no crea la cuenta con los campos obligatorios vacíos', () => {
    clic('Empezar a registrar');
    clic('Crear cuenta de tostador');

    http.expectNone(URL_TOSTADORES);
    expect(pasoActual()).toBe('Paso 2 de 3');
    expect(pagina.textContent).toContain('Poné el nombre de tu negocio.');
    expect(pagina.textContent).toContain('Poné un teléfono de contacto.');
    expect(pagina.textContent).toContain('Poné un correo de contacto.');
    expect(pagina.textContent).toContain('Elegí al menos un estilo de tueste.');
    expect(pagina.querySelector('.ubicacion--error')).not.toBeNull();
  });

  it('rechaza teléfono y correo con formato inválido', () => {
    clic('Empezar a registrar');
    llenar();
    componente['formulario'].patchValue({ telefono: '1234', correo: 'mariana' });
    clic('Crear cuenta de tostador');

    expect(pasoActual()).toBe('Paso 2 de 3');
    expect(pagina.textContent).toContain('Debe tener 8 dígitos');
    expect(pagina.textContent).toContain('Ese correo no es válido.');
  });

  it('limita la descripción a 300 caracteres', () => {
    const descripcion = componente['formulario'].controls.descripcion;
    descripcion.setValue('a'.repeat(301));
    expect(descripcion.valid).toBeFalse();
    descripcion.setValue('');
    expect(descripcion.valid).toBeTrue();
  });

  it('toma el cantón y la provincia del pin', () => {
    clic('Empezar a registrar');
    componente['pin'].set(TIBAS);
    fixture.detectChanges();
    expect(pagina.querySelector('.ubicacion')?.textContent).toContain('Tibás, San José');

    componente['pin'].set(OCEANO);
    fixture.detectChanges();
    expect(pagina.querySelector('.ubicacion')?.textContent).toContain('fuera de los cantones');
  });

  it('permite elegir y quitar varios estilos de tueste', () => {
    clic('Empezar a registrar');
    clic('Oscuro');
    clic('Claro');
    expect(componente['formulario'].controls.estilos.value).toEqual(['Claro', 'Oscuro']);

    clic('Oscuro');
    expect(componente['formulario'].controls.estilos.value).toEqual(['Claro']);
    expect(boton('Claro').getAttribute('aria-pressed')).toBe('true');
    expect(boton('Oscuro').getAttribute('aria-pressed')).toBe('false');
  });

  it('crea el negocio en el backend, muestra el resumen y va al dashboard', () => {
    const { method, body } = crearCuenta();

    expect(method).toBe('POST');
    expect(body).toEqual(
      jasmine.objectContaining({
        nombre: 'Tostaduría Volcán',
        telefono: '+506 8888-1234',
        canton: 'Tibás',
        provincia: 'San José',
        estilos: ['CLARO', 'MEDIO'],
      }),
    );
    expect(pasoActual()).toBe('Paso 3 de 3');
    const resumen = pagina.querySelector('.resumen')!.textContent!;
    expect(resumen).toContain('Tostaduría Volcán');
    expect(resumen).toContain('Mariana Castro');
    expect(resumen).toContain('Tibás, San José');
    expect(resumen).toContain('Claro y Medio');

    expect(boton('Ir a mi dashboard')).toBeTruthy();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    clic('Ir a mi dashboard');
    expect(router.navigateByUrl).toHaveBeenCalledWith(RUTA_DASHBOARD_TOSTADOR);
  });

  it('con un solo rol no muestra progreso de cadena', () => {
    TestBed.inject(OnboardingRolesService).iniciar(['tostador']);
    fixture.detectChanges();

    expect(pagina.querySelector('.onboarding__progreso-roles')).toBeNull();
    expect(pagina.textContent).not.toContain('Rol 1 de');
  });

  it('con roles pendientes continúa al siguiente onboarding', () => {
    TestBed.inject(OnboardingRolesService).iniciar(['tostador', 'cafeteria']);
    fixture.detectChanges();

    expect(pagina.querySelector('.onboarding__progreso-roles')!.textContent).toContain(
      'Rol 1 de 2',
    );

    crearCuenta();

    expect(boton('Continuar con el siguiente rol')).toBeTruthy();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    clic('Continuar con el siguiente rol');

    expect(router.navigateByUrl).toHaveBeenCalledWith('/onboarding-cafeteria');
    expect(TestBed.inject(OnboardingRolesService).siguienteRuta()).toBeNull();
  });

  it('muestra el error del backend y deja corregir', () => {
    clic('Empezar a registrar');
    llenar();
    clic('Crear cuenta de tostador');
    expect(boton('Crear cuenta de tostador').disabled).toBeTrue();

    http
      .expectOne(URL_TOSTADORES)
      .flush(
        { mensaje: 'Tu cuenta ya tiene un negocio registrado.' },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();

    expect(pasoActual()).toBe('Paso 2 de 3');
    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain('ya tiene un negocio');
    expect(boton('Crear cuenta de tostador').disabled).toBeFalse();
  });

  it('vuelve al formulario con los datos para editarlos', () => {
    crearCuenta();

    clic('Editar información');
    expect(pasoActual()).toBe('Paso 2 de 3');
    expect(pagina.querySelector<HTMLInputElement>('#nombre-negocio')!.value).toBe(
      'Tostaduría Volcán',
    );

    componente['formulario'].controls.nombre.setValue('Volcán Tostadores');
    clic('Guardar cambios');
    const peticion = http.expectOne(`${URL_TOSTADORES}/${NEGOCIO_API.id}`);
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body.nombre).toBe('Volcán Tostadores');
    peticion.flush({ ...NEGOCIO_API, nombre: 'Volcán Tostadores' });
    fixture.detectChanges();

    expect(pasoActual()).toBe('Paso 3 de 3');
    expect(pagina.querySelector('.resumen')!.textContent).toContain('Volcán Tostadores');
  });

  it('descarta los cambios al cancelar la edición', () => {
    crearCuenta();

    clic('Editar información');
    componente['formulario'].controls.nombre.setValue('Otro nombre');
    componente['pin'].set(OCEANO);
    clic('Cancelar');

    expect(pasoActual()).toBe('Paso 3 de 3');
    expect(componente['formulario'].controls.nombre.value).toBe('Tostaduría Volcán');
    expect(componente['pin']()).toEqual(TIBAS);
  });
});
