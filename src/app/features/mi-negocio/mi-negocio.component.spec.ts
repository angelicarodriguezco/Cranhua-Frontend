import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER } from 'rxjs';

import { NEGOCIO_EJEMPLO } from '../../core/mocks/negocio-tueste.mock';
import { Coordenada } from '../../core/models/negocio-tueste.model';
import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { NegocioTuesteService } from '../../core/services/negocio-tueste.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import {
  AVISO_ELIMINAR_NEGOCIO,
  DESCRIPCION_ELIMINAR_NEGOCIO,
  inicialesNegocio,
  MiNegocioComponent,
  RUTA_DASHBOARD_TOSTADOR,
} from './mi-negocio.component';

const TIBAS: Coordenada = { lat: 9.959, lng: -84.082 };
const OCEANO: Coordenada = { lat: 8.5, lng: -86.5 };

describe('MiNegocioComponent', () => {
  let fixture: ComponentFixture<MiNegocioComponent>;
  let componente: MiNegocioComponent;
  let pagina: HTMLElement;
  let negocioService: NegocioTuesteService;
  let dashboard: DashboardTostadorService;

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

    negocioService = TestBed.inject(NegocioTuesteService);
    dashboard = TestBed.inject(DashboardTostadorService);
    fixture = TestBed.createComponent(MiNegocioComponent);
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

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
    expect(campo('h1').textContent).toContain('Mi negocio');
    expect(pagina.textContent).toContain(
      'Así ven tu tostaduría los cafetaleros que exploran cosechas.',
    );
    const valores = [...pagina.querySelectorAll('.campo__valor')].map((v) => v.textContent!.trim());
    expect(valores).toContain(NEGOCIO_EJEMPLO.nombre);
    expect(valores).toContain(NEGOCIO_EJEMPLO.contacto);
    expect(valores).toContain(NEGOCIO_EJEMPLO.correo);
    expect(valores.some((v) => v.includes('San José'))).toBeTrue();
    expect(campo('.avatar__iniciales').textContent!.trim()).toBe('TV');
    expect(pagina.querySelector('.mapa--solo-lectura')).toBeTruthy();
    expect(pagina.textContent).toContain('Claro');
    expect(pagina.textContent).toContain('Medio');
    expect(pagina.querySelector('#nombre-negocio')).toBeNull();
    expect(pagina.querySelector('app-zona-peligro')).toBeNull();
    expect(boton('Editar negocio')).toBeTruthy();
  });

  it('entra a edición y carga los datos del negocio', () => {
    entrarAEdicion();

    expect(campo('h1').textContent).toContain('Editar negocio');
    expect(campo<HTMLInputElement>('#nombre-negocio').value).toBe(NEGOCIO_EJEMPLO.nombre);
    expect(campo<HTMLInputElement>('#contacto-negocio').value).toBe(NEGOCIO_EJEMPLO.contacto);
    expect(campo<HTMLInputElement>('#correo-negocio').value).toBe(NEGOCIO_EJEMPLO.correo);
    expect(campo<HTMLInputElement>('#ubicacion-negocio').value).toContain('San José');
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
    componente['pin'].set(TIBAS);
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#ubicacion-negocio').value).toContain('Tibás');

    componente['pin'].set(OCEANO);
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#ubicacion-negocio').value).toBe('');
  });

  it('muestra la zona de peligro y confirma la eliminación', () => {
    entrarAEdicion();
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const eliminar = spyOn(negocioService, 'eliminar').and.callThrough();

    expect(pagina.querySelector('app-zona-peligro')).toBeTruthy();
    expect(pagina.textContent).toContain(DESCRIPCION_ELIMINAR_NEGOCIO);

    boton('Eliminar negocio').click();
    fixture.detectChanges();
    expect(campo('.modal__titulo').textContent).toBe(`¿Eliminar ${NEGOCIO_EJEMPLO.nombre}?`);
    expect(campo('.modal__aviso').textContent).toContain(AVISO_ELIMINAR_NEGOCIO);

    campo<HTMLButtonElement>('.modal__btn--peligro').click();
    fixture.detectChanges();

    expect(eliminar).toHaveBeenCalledWith(NEGOCIO_EJEMPLO.id);
    expect(navegar).toHaveBeenCalledWith(RUTA_DASHBOARD_TOSTADOR);
  });

  it('guarda cambios y vuelve a la vista', () => {
    entrarAEdicion();
    const actualizar = spyOn(negocioService, 'actualizar').and.callThrough();

    campo<HTMLInputElement>('#nombre-negocio').value = 'Tostaduría Volcán Sur';
    campo<HTMLInputElement>('#nombre-negocio').dispatchEvent(new Event('input'));
    fixture.detectChanges();

    boton('Guardar cambios').click();
    fixture.detectChanges();

    expect(actualizar).toHaveBeenCalled();
    const guardado = actualizar.calls.mostRecent().args[0];
    expect(guardado.id).toBe(NEGOCIO_EJEMPLO.id);
    expect(guardado.nombre).toBe('Tostaduría Volcán Sur');
    expect(pagina.querySelector('.campo__valor')?.textContent).toContain('Tostaduría Volcán Sur');
    expect(pagina.querySelector('#nombre-negocio')).toBeNull();
  });

  it('cancela y vuelve a la vista con el estado guardado', () => {
    entrarAEdicion();
    campo<HTMLInputElement>('#nombre-negocio').value = 'Otro nombre';
    campo<HTMLInputElement>('#nombre-negocio').dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#nombre-negocio').value).toBe('Otro nombre');

    boton('Cancelar').click();
    fixture.detectChanges();
    expect(pagina.querySelector('.campo__valor')?.textContent).toContain(NEGOCIO_EJEMPLO.nombre);
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
