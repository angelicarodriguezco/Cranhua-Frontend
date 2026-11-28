import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER } from 'rxjs';

import { Coordenada, NegocioTuesteApi } from '../../core/models/negocio-tueste.model';
import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import {
  avisoEliminarNegocio,
  DESCRIPCION_ELIMINAR_NEGOCIO,
  inicialesNegocio,
  MiNegocioComponent,
  RUTA_ONBOARDING_TOSTADOR,
} from './mi-negocio.component';
import { CANTONES_DE_PRUEBA, responderCantones } from '../../core/testing/cantones-de-prueba';
import { NEGOCIO_API, URL_TOSTADORES } from '../../core/testing/negocio-tueste.fixture';
import { conSesionDeEjemplo } from '../../core/testing/sesion-de-ejemplo';

const ESCAZU: Coordenada = { lat: 9.919, lng: -84.14 };
const OCEANO: Coordenada = { lat: 8.5, lng: -86.5 };

describe('MiNegocioComponent', () => {
  let fixture: ComponentFixture<MiNegocioComponent>;
  let componente: MiNegocioComponent;
  let pagina: HTMLElement;
  let dashboard: DashboardTostadorService;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiNegocioComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
      ],
    }).compileComponents();

    dashboard = TestBed.inject(DashboardTostadorService);
    http = TestBed.inject(HttpTestingController);
    conSesionDeEjemplo();
    fixture = TestBed.createComponent(MiNegocioComponent);
    responderCantones();
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  function cargar(negocio: NegocioTuesteApi = NEGOCIO_API): void {
    http.expectOne(`${URL_TOSTADORES}/actual`).flush(negocio);
    fixture.detectChanges();
  }

  function elegirPortada(archivo: File): void {
    const input = campo<HTMLInputElement>('input[type="file"]');
    const datos = new DataTransfer();
    datos.items.add(archivo);
    input.files = datos.files;
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function guardar() {
    boton('Guardar cambios').click();
    fixture.detectChanges();
    return http.expectOne(`${URL_TOSTADORES}/${NEGOCIO_API.id}`);
  }

  function campo<T extends HTMLElement>(selector: string): T {
    return pagina.querySelector<T>(selector)!;
  }

  function boton(texto: string): HTMLButtonElement {
    const encontrado = [...pagina.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(texto),
    );
    if (!encontrado) {
      throw new Error(`No hay botón "${texto}"`);
    }
    return encontrado;
  }

  function entrarAEdicion(): void {
    cargar();
    boton('Editar negocio').click();
    fixture.detectChanges();
  }

  function errores(): string[] {
    return [...pagina.querySelectorAll('.campo__error')].map((e) => e.textContent!.trim());
  }

  it('calcula iniciales del nombre del negocio', () => {
    expect(inicialesNegocio('Tostaduría Volcán')).toBe('TV');
    expect(inicialesNegocio('Volcán')).toBe('VO');
  });

  it('muestra la vista de solo lectura del negocio', () => {
    expect(pagina.textContent).toContain('Cargando tu negocio…');
    cargar({ ...NEGOCIO_API, portadaUrl: 'https://res.cloudinary.com/demo/portada.jpg' });

    expect(campo('h1').textContent).toContain('Mi negocio');
    expect(pagina.textContent).toContain(
      'Así ven tu tostaduría los cafetaleros que exploran cosechas.',
    );
    const valores = [...pagina.querySelectorAll('.campo__valor')].map((v) => v.textContent!.trim());
    expect(valores).toContain(NEGOCIO_API.nombre);
    expect(valores).toContain(NEGOCIO_API.nombreContacto);
    expect(valores).toContain(NEGOCIO_API.correo);
    expect(valores).toContain('Tibás, San José');
    expect(campo<HTMLImageElement>('.portada__imagen').src).toBe(
      'https://res.cloudinary.com/demo/portada.jpg',
    );
    expect(campo('.avatar__iniciales').textContent!.trim()).toBe('TV');
    expect(pagina.querySelector('.mapa--solo-lectura')).toBeTruthy();
    expect(pagina.textContent).toContain('Claro');
    expect(pagina.textContent).toContain('Medio');
    expect(pagina.querySelector('#nombre-negocio')).toBeNull();
    expect(pagina.querySelector('app-zona-peligro')).toBeNull();
    expect(boton('Editar negocio')).toBeTruthy();
  });

  it('sin negocio registrado lleva al onboarding', () => {
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    http
      .expectOne(`${URL_TOSTADORES}/actual`)
      .flush({ mensaje: 'Sin negocio.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    boton('Registrar negocio').click();
    expect(navegar).toHaveBeenCalledWith(RUTA_ONBOARDING_TOSTADOR);
  });

  it('avisa si no pudo cargar el negocio', () => {
    http
      .expectOne(`${URL_TOSTADORES}/actual`)
      .flush({ mensaje: 'Servicio caído.' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(pagina.textContent).toContain('Servicio caído.');
  });

  it('entra a edición y carga los datos del negocio', () => {
    entrarAEdicion();

    expect(campo('h1').textContent).toContain('Editar negocio');
    expect(campo<HTMLInputElement>('#nombre-negocio').value).toBe(NEGOCIO_API.nombre);
    expect(campo<HTMLInputElement>('#contacto-negocio').value).toBe(NEGOCIO_API.nombreContacto);
    expect(campo<HTMLInputElement>('#correo-negocio').value).toBe(NEGOCIO_API.correo);
    expect(campo<HTMLInputElement>('#ubicacion-negocio').value).toBe('Tibás, San José');
    expect(componente['pin']()).toEqual(
      CANTONES_DE_PRUEBA.find((c) => c.nombre === 'Tibás')!.cabecera,
    );
    expect(campo<HTMLInputElement>('#ubicacion-negocio').readOnly).toBeTrue();
  });

  it('muestra errores al guardar con campos vacíos', () => {
    entrarAEdicion();
    componente['formulario'].reset({
      nombre: '',
      descripcion: '',
      contacto: '',
      telefono: '',
      correo: '',
      estilos: [],
    });
    componente['pin'].set(null);
    fixture.detectChanges();

    boton('Guardar cambios').click();
    fixture.detectChanges();

    expect(errores().length).toBeGreaterThan(0);
    expect(pagina.textContent).toContain('Poné el nombre de tu negocio.');
    expect(pagina.textContent).toContain('Elegí al menos un estilo de tueste.');
    expect(pagina.textContent).toContain('Marcá en el mapa dónde está tu tostaduría.');
  });

  it('permite alternar estilos de tueste', () => {
    entrarAEdicion();
    expect(componente['seleccionado']('Claro')).toBeTrue();
    expect(componente['seleccionado']('Medio')).toBeTrue();
    expect(componente['seleccionado']('Oscuro')).toBeFalse();

    boton('Oscuro').click();
    fixture.detectChanges();
    expect(componente['seleccionado']('Oscuro')).toBeTrue();

    boton('Claro').click();
    fixture.detectChanges();
    expect(componente['seleccionado']('Claro')).toBeFalse();
  });

  it('actualiza el texto de ubicación desde el pin', () => {
    entrarAEdicion();
    componente['pin'].set(ESCAZU);
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#ubicacion-negocio').value).toContain('Escazú');

    componente['pin'].set(OCEANO);
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#ubicacion-negocio').value).toBe('');
  });

  function confirmarEliminar() {
    boton('Eliminar negocio').click();
    fixture.detectChanges();
    campo<HTMLButtonElement>('.modal__btn--peligro').click();
    fixture.detectChanges();
    return http.expectOne(`${URL_TOSTADORES}/${NEGOCIO_API.id}`);
  }

  it('sin historial confirma un borrado normal y vuelve al onboarding', () => {
    entrarAEdicion();
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    expect(pagina.querySelector('app-zona-peligro')).toBeTruthy();
    expect(pagina.textContent).toContain(DESCRIPCION_ELIMINAR_NEGOCIO);

    boton('Eliminar negocio').click();
    fixture.detectChanges();
    expect(campo('.modal__titulo').textContent).toBe(`¿Eliminar ${NEGOCIO_API.nombre}?`);
    expect(pagina.querySelector('.modal__aviso')).toBeNull();

    campo<HTMLButtonElement>('.modal__btn--peligro').click();
    fixture.detectChanges();
    const peticion = http.expectOne(`${URL_TOSTADORES}/${NEGOCIO_API.id}`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null, { status: 204, statusText: 'No Content' });

    expect(pagina.querySelector('.modal__titulo')).toBeNull();
    expect(navegar).toHaveBeenCalledWith(RUTA_ONBOARDING_TOSTADOR);
  });

  it('con historial el modal avisa con el código del backend', () => {
    const historial = { tieneHistorial: true, codigoEjemplo: 'CRH-2026-0101' };
    cargar({ ...NEGOCIO_API, historialTrazabilidad: historial });
    boton('Editar negocio').click();
    fixture.detectChanges();

    boton('Eliminar negocio').click();
    fixture.detectChanges();

    expect(campo('.modal__aviso').textContent).toContain(avisoEliminarNegocio(historial)!);
    expect(campo('.modal__aviso').textContent).toContain('CRH-2026-0101');
  });

  it('si el backend rechaza la eliminación muestra su mensaje y no navega', () => {
    entrarAEdicion();
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    confirmarEliminar().flush(
      { mensaje: 'Solo el dueño del negocio puede editarlo o eliminarlo.' },
      { status: 403, statusText: 'Forbidden' },
    );
    fixture.detectChanges();

    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain(
      'Solo el dueño del negocio puede editarlo o eliminarlo.',
    );
    expect(navegar).not.toHaveBeenCalled();
  });

  it('guarda cambios y vuelve a la vista', () => {
    entrarAEdicion();

    campo<HTMLInputElement>('#nombre-negocio').value = 'Tostaduría Volcán Sur';
    campo<HTMLInputElement>('#nombre-negocio').dispatchEvent(new Event('input'));
    fixture.detectChanges();

    componente['pin'].set(ESCAZU);

    const peticion = guardar();
    expect(peticion.request.method).toBe('PATCH');
    expect(peticion.request.body).toEqual(
      jasmine.objectContaining({
        nombre: 'Tostaduría Volcán Sur',
        canton: 'Escazú',
        estilos: ['CLARO', 'MEDIO'],
      }),
    );
    expect(boton('Guardar cambios').disabled).toBeTrue();
    peticion.flush({ ...NEGOCIO_API, nombre: 'Tostaduría Volcán Sur', canton: 'Escazú' });
    fixture.detectChanges();

    expect(pagina.querySelector('.campo__valor')?.textContent).toContain('Tostaduría Volcán Sur');
    expect(pagina.querySelector('#nombre-negocio')).toBeNull();
  });

  it('sube la portada nueva después de guardar los datos', () => {
    entrarAEdicion();
    const archivo = new File(['x'], 'portada.png', { type: 'image/png' });
    elegirPortada(archivo);
    expect(campo<HTMLImageElement>('.portada__imagen').src).toContain('blob:');

    guardar().flush(NEGOCIO_API);
    const subida = http.expectOne(`${URL_TOSTADORES}/${NEGOCIO_API.id}/portada`);
    expect((subida.request.body as FormData).get('archivo')).toEqual(archivo);
    subida.flush({ ...NEGOCIO_API, portadaUrl: 'https://res.cloudinary.com/demo/nueva.png' });
    fixture.detectChanges();

    expect(campo<HTMLImageElement>('.portada__imagen').src).toBe(
      'https://res.cloudinary.com/demo/nueva.png',
    );
  });

  it('si falla la portada avisa y conserva los datos ya guardados', () => {
    entrarAEdicion();
    elegirPortada(new File(['x'], 'portada.png', { type: 'image/png' }));
    guardar().flush({ ...NEGOCIO_API, nombre: 'Volcán Sur' });
    http
      .expectOne(`${URL_TOSTADORES}/${NEGOCIO_API.id}/portada`)
      .flush({ mensaje: 'No se pudo subir.' }, { status: 502, statusText: 'Bad Gateway' });
    fixture.detectChanges();
    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain('No se pudo subir.');

    boton('Cancelar').click();
    fixture.detectChanges();
    expect(pagina.querySelector('.campo__valor')?.textContent).toContain('Volcán Sur');
    expect(pagina.querySelector('.portada__imagen')).toBeNull();
  });

  it('rechaza una portada con formato no permitido', () => {
    entrarAEdicion();
    elegirPortada(new File(['x'], 'portada.gif', { type: 'image/gif' }));
    expect(pagina.textContent).toContain('Solo se permiten imágenes JPG, PNG o WebP.');
    expect(pagina.querySelector('.portada__imagen')).toBeNull();
  });

  it('muestra los errores por campo del backend', () => {
    entrarAEdicion();
    guardar().flush(
      { mensaje: 'Revisá los datos ingresados.', errores: { correo: 'Ingresá un correo válido.' } },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();
    expect(pagina.querySelector('[role="alert"]')?.textContent).toBe('Ingresá un correo válido.');
  });

  it('cancela y vuelve a la vista con el estado guardado', () => {
    entrarAEdicion();
    campo<HTMLInputElement>('#nombre-negocio').value = 'Otro nombre';
    campo<HTMLInputElement>('#nombre-negocio').dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#nombre-negocio').value).toBe('Otro nombre');

    boton('Cancelar').click();
    fixture.detectChanges();
    expect(pagina.querySelector('.campo__valor')?.textContent).toContain(NEGOCIO_API.nombre);
    expect(pagina.querySelector('#nombre-negocio')).toBeNull();
  });

  it('sigue el tema global claro/oscuro', () => {
    expect(dashboard.tema()).toBe('claro');
    expect(pagina.getAttribute('data-theme')).toBe('claro');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(dashboard.tema()).toBe('oscuro');
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
  });
});
