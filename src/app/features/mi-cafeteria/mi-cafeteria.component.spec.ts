import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER } from 'rxjs';

import { CAFETERIA_EJEMPLO } from '../../core/mocks/cafeteria.mock';
import { Coordenada } from '../../core/models/finca.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import {
  DESCRIPCION_ELIMINAR_CAFETERIA,
  inicialesCafeteria,
  MiCafeteriaComponent,
  RUTA_DASHBOARD_CAFETERIA,
  RUTA_PUBLICAR_MENU,
} from './mi-cafeteria.component';

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
        provideRouter([]),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
      ],
    }).compileComponents();

    cafeteriaService = TestBed.inject(CafeteriaService);
    dashboard = TestBed.inject(DashboardCafeteriaService);
    fixture = TestBed.createComponent(MiCafeteriaComponent);
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

  function errores(): string[] {
    return [...pagina.querySelectorAll('.campo__error')].map((e) => e.textContent!.trim());
  }

  it('calcula iniciales del nombre de la cafetería', () => {
    expect(inicialesCafeteria('Café Brumas')).toBe('CB');
    expect(inicialesCafeteria('Brumas')).toBe('BR');
  });

  it('carga los datos mock de la cafetería actual', () => {
    expect(campo('h1').textContent).toContain('Mi cafetería');
    expect(pagina.textContent).toContain('Así ven tu local los tostadores dentro de Cránhua.');
    expect(boton('Publicar en el menú')).toBeTruthy();
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
    componente['pin'].set(ESCAZU);
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#ubicacion-cafeteria').value).toBe('Escazú, San José');

    componente['pin'].set(OCEANO);
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#ubicacion-cafeteria').value).toBe('');
  });

  it('rechaza guardar si el pin queda fuera de los cantones', () => {
    const actualizar = spyOn(cafeteriaService, 'actualizar');
    componente['pin'].set(OCEANO);
    fixture.detectChanges();

    boton('Guardar cambios').click();
    fixture.detectChanges();

    expect(actualizar).not.toHaveBeenCalled();
    expect(pagina.textContent).toContain(
      'El pin está fuera de los cantones de ejemplo. Movelo más cerca de tu local.',
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
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const eliminar = spyOn(cafeteriaService, 'eliminar').and.callThrough();

    expect(pagina.querySelector('app-zona-peligro')).toBeTruthy();
    expect(pagina.textContent).toContain(DESCRIPCION_ELIMINAR_CAFETERIA);

    boton('Eliminar cafetería').click();
    fixture.detectChanges();
    expect(pagina.querySelector('app-modal-confirmacion')).toBeTruthy();

    campo<HTMLButtonElement>('.modal__btn--peligro').click();
    fixture.detectChanges();

    expect(eliminar).toHaveBeenCalledWith(CAFETERIA_EJEMPLO.id);
    expect(navegar).toHaveBeenCalledWith(RUTA_DASHBOARD_CAFETERIA);
  });

  it('guarda cambios en el mock de la cafetería', () => {
    const actualizar = spyOn(cafeteriaService, 'actualizar').and.callThrough();

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
    expect(campo<HTMLInputElement>('#nombre-cafeteria').value).toBe('Café Brumas Norte');
    expect(campo('.avatar__iniciales').textContent!.trim()).toBe('CB');
  });

  it('cancela y restaura el último estado guardado', () => {
    campo<HTMLInputElement>('#nombre-cafeteria').value = 'Otro nombre';
    campo<HTMLInputElement>('#nombre-cafeteria').dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#nombre-cafeteria').value).toBe('Otro nombre');

    boton('Cancelar').click();
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#nombre-cafeteria').value).toBe(CAFETERIA_EJEMPLO.nombre);
  });

  it('sigue el tema global claro/oscuro', () => {
    expect(dashboard.tema()).toBe('oscuro');
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(dashboard.tema()).toBe('claro');
    expect(pagina.getAttribute('data-theme')).toBe('claro');
  });
});
