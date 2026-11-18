import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER, of } from 'rxjs';

import { CAFETERIA_EJEMPLO } from '../../core/mocks/cafeteria.mock';
import { Coordenada } from '../../core/models/finca.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import {
  AVISO_ELIMINAR_CAFETERIA,
  DESCRIPCION_ELIMINAR_CAFETERIA,
  inicialesCafeteria,
  MiCafeteriaComponent,
  RUTA_DASHBOARD_CAFETERIA,
  RUTA_PUBLICAR_MENU,
} from './mi-cafeteria.component';
import { responderCantones } from '../../core/testing/cantones-de-prueba';

const ESCAZU: Coordenada = { lat: 9.9189, lng: -84.1397 };
const OCEANO: Coordenada = { lat: 8.5, lng: -86.5 };

describe('MiCafeteriaComponent', () => {
  let fixture: ComponentFixture<MiCafeteriaComponent>;
  let componente: MiCafeteriaComponent;
  let pagina: HTMLElement;
  let cafeteriaService: CafeteriaService;
  let dashboard: DashboardCafeteriaService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiCafeteriaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
      ],
    }).compileComponents();

    cafeteriaService = TestBed.inject(CafeteriaService);
    dashboard = TestBed.inject(DashboardCafeteriaService);
    spyOn(cafeteriaService, 'obtenerActual').and.returnValue(of(CAFETERIA_EJEMPLO));

    fixture = TestBed.createComponent(MiCafeteriaComponent);
    responderCantones();
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
    boton('Editar cafetería').click();
    fixture.detectChanges();
  }

  function errores(): string[] {
    return [...pagina.querySelectorAll('.campo__error')].map((e) => e.textContent!.trim());
  }

  it('calcula iniciales del nombre de la cafetería', () => {
    expect(inicialesCafeteria('Café Brumas')).toBe('CB');
    expect(inicialesCafeteria('Brumas')).toBe('BR');
  });

  it('muestra la vista de solo lectura de la cafetería', () => {
    expect(campo('h1').textContent).toContain('Mi cafetería');
    expect(pagina.textContent).toContain('Así ven tu local los tostadores dentro de Cránhua.');
    const valores = [...pagina.querySelectorAll('.campo__valor')].map((v) => v.textContent!.trim());
    expect(valores).toContain(CAFETERIA_EJEMPLO.nombre);
    expect(valores).toContain(CAFETERIA_EJEMPLO.contacto);
    expect(valores).toContain(CAFETERIA_EJEMPLO.correo);
    expect(valores.some((v) => v.includes('Escazú'))).toBeTrue();
    expect(campo('.avatar__iniciales').textContent!.trim()).toBe('CB');
    expect(pagina.querySelector('.mapa--solo-lectura')).toBeTruthy();
    expect(pagina.textContent).toContain('Claro');
    expect(pagina.textContent).toContain('Medio');
    expect(pagina.querySelector('#nombre-cafeteria')).toBeNull();
    expect(pagina.querySelector('app-zona-peligro')).toBeNull();
    expect(boton('Editar cafetería')).toBeTruthy();
    expect(boton('Publicar en el menú')).toBeTruthy();
  });

  it('muestra el menú publicado colapsado y lo abre al hacer click', () => {
    const toggle = campo<HTMLButtonElement>('.menu-publicado__toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(pagina.querySelector('#menu-publicado-contenido')).toBeNull();
    expect(pagina.textContent).toContain('Menú publicado');
    expect(pagina.textContent).toContain('(5)');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(pagina.querySelector('#menu-publicado-contenido')).toBeTruthy();
    expect(pagina.textContent).toContain('Cafés');
    expect(pagina.textContent).toContain('Espresso Tarrazú');
    expect(pagina.textContent).toContain('Otras comidas');
    expect(pagina.textContent).toContain('Queque de naranja');
    expect(pagina.textContent).toContain('Ocultar');
  });

  it('entra a edición y carga los datos de la cafetería', () => {
    entrarAEdicion();

    expect(campo('h1').textContent).toContain('Editar cafetería');
    expect(boton('Cambiar portada')).toBeTruthy();
    expect(pagina.textContent).toContain('Mover pin en el mapa');
    expect(campo<HTMLInputElement>('#nombre-cafeteria').value).toBe(CAFETERIA_EJEMPLO.nombre);
    expect(campo<HTMLInputElement>('#contacto-cafeteria').value).toBe(CAFETERIA_EJEMPLO.contacto);
    expect(campo<HTMLInputElement>('#telefono-cafeteria').value).toBe(CAFETERIA_EJEMPLO.telefono);
    expect(campo<HTMLInputElement>('#correo-cafeteria').value).toBe(CAFETERIA_EJEMPLO.correo);
    expect(campo<HTMLTextAreaElement>('#descripcion-cafeteria').value).toBe(
      CAFETERIA_EJEMPLO.descripcion ?? '',
    );
    expect(campo<HTMLInputElement>('#horario-cafeteria').value).toBe(
      CAFETERIA_EJEMPLO.horario ?? '',
    );
    expect(campo('.avatar__iniciales').textContent!.trim()).toBe('CB');
    expect(campo<HTMLInputElement>('#ubicacion-cafeteria').value).toBe('Escazú, San José');
    expect(campo<HTMLInputElement>('#ubicacion-cafeteria').readOnly).toBeTrue();
    expect(componente['estilosDisponibles']).toEqual(['Claro', 'Medio', 'Oscuro']);
    expect(pagina.textContent).not.toContain('Espresso');
  });

  it('muestra errores al guardar con campos vacíos', () => {
    entrarAEdicion();
    componente['formulario'].reset({
      nombre: '',
      descripcion: '',
      horario: '',
      contacto: '',
      telefono: '',
      correo: '',
    });
    componente['estilos'].reset([]);
    componente['pin'].set(null);
    fixture.detectChanges();

    boton('Guardar cambios').click();
    fixture.detectChanges();

    expect(errores().length).toBeGreaterThan(0);
    expect(pagina.textContent).toContain('Poné el nombre de tu cafetería.');
    expect(pagina.textContent).toContain('Elegí al menos un estilo de café.');
    expect(pagina.textContent).toContain('Marcá en el mapa dónde está tu local.');
  });

  it('permite alternar estilos de café', () => {
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
    expect(campo<HTMLInputElement>('#ubicacion-cafeteria').value).toBe('Escazú, San José');

    componente['pin'].set(OCEANO);
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#ubicacion-cafeteria').value).toBe('');
  });

  it('rechaza guardar si el pin queda fuera de los cantones', () => {
    entrarAEdicion();
    const actualizar = spyOn(cafeteriaService, 'actualizar');
    componente['pin'].set(OCEANO);
    fixture.detectChanges();

    boton('Guardar cambios').click();
    fixture.detectChanges();

    expect(actualizar).not.toHaveBeenCalled();
    expect(pagina.textContent).toContain(
      'El pin está fuera de los cantones de Costa Rica. Movelo más cerca de tu local.',
    );
  });

  it('navega a publicar en el menú', () => {
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    boton('Publicar en el menú').click();
    fixture.detectChanges();

    expect(navegar).toHaveBeenCalledWith(RUTA_PUBLICAR_MENU);
  });

  it('muestra la zona de peligro y confirma la eliminación', () => {
    entrarAEdicion();
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const eliminar = spyOn(cafeteriaService, 'eliminar').and.returnValue(of(true));

    expect(pagina.querySelector('app-zona-peligro')).toBeTruthy();
    expect(pagina.textContent).toContain(DESCRIPCION_ELIMINAR_CAFETERIA);

    boton('Eliminar cafetería').click();
    fixture.detectChanges();
    expect(campo('.modal__titulo').textContent).toBe('¿Eliminar Cafetería Café Brumas?');
    expect(campo('.modal__aviso').textContent).toContain(AVISO_ELIMINAR_CAFETERIA);
    expect(getComputedStyle(pagina.querySelector('.modal__dialogo')!).backgroundColor).toBe(
      'rgb(255, 255, 255)',
    );

    campo<HTMLButtonElement>('.modal__btn--peligro').click();
    fixture.detectChanges();

    expect(eliminar).toHaveBeenCalledWith(CAFETERIA_EJEMPLO.id);
    expect(navegar).toHaveBeenCalledWith(RUTA_DASHBOARD_CAFETERIA);
  });

  it('guarda cambios y vuelve a la vista', () => {
    entrarAEdicion();
    const actualizar = spyOn(cafeteriaService, 'actualizar').and.callFake((cafeteria) =>
      of(cafeteria),
    );

    campo<HTMLInputElement>('#nombre-cafeteria').value = 'Café Brumas Norte';
    campo<HTMLInputElement>('#nombre-cafeteria').dispatchEvent(new Event('input'));
    fixture.detectChanges();

    boton('Guardar cambios').click();
    fixture.detectChanges();

    expect(actualizar).toHaveBeenCalled();
    const guardado = actualizar.calls.mostRecent().args[0];
    expect(guardado.id).toBe(CAFETERIA_EJEMPLO.id);
    expect(guardado.nombre).toBe('Café Brumas Norte');
    expect(guardado.volumenMensual).toBe(CAFETERIA_EJEMPLO.volumenMensual);
    expect(pagina.querySelector('.campo__valor')?.textContent).toContain('Café Brumas Norte');
    expect(pagina.querySelector('#nombre-cafeteria')).toBeNull();
  });

  it('cancela y vuelve a la vista con el estado guardado', () => {
    entrarAEdicion();
    campo<HTMLInputElement>('#nombre-cafeteria').value = 'Otro nombre';
    campo<HTMLInputElement>('#nombre-cafeteria').dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#nombre-cafeteria').value).toBe('Otro nombre');

    boton('Cancelar').click();
    fixture.detectChanges();
    expect(pagina.querySelector('.campo__valor')?.textContent).toContain(CAFETERIA_EJEMPLO.nombre);
    expect(pagina.querySelector('#nombre-cafeteria')).toBeNull();
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
