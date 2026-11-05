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

  function errores(): string[] {
    return [...pagina.querySelectorAll('.campo__error')].map((e) => e.textContent!.trim());
  }

  it('calcula iniciales del nombre del negocio', () => {
    expect(inicialesNegocio('Tostaduría Volcán')).toBe('TV');
    expect(inicialesNegocio('Volcán')).toBe('VO');
  });

  it('carga los datos mock del negocio actual', () => {
    expect(campo('h1').textContent).toContain('Mi negocio');
    expect(pagina.textContent).toContain(
      'Así ven tu tostaduría los cafetaleros que exploran cosechas.',
    );
    expect(campo<HTMLInputElement>('#nombre-negocio').value).toBe(NEGOCIO_EJEMPLO.nombre);
    expect(campo<HTMLInputElement>('#contacto-negocio').value).toBe(NEGOCIO_EJEMPLO.contacto);
    expect(campo<HTMLInputElement>('#correo-negocio').value).toBe(NEGOCIO_EJEMPLO.correo);
    expect(campo('.avatar__iniciales').textContent!.trim()).toBe('TV');
    expect(campo<HTMLInputElement>('#ubicacion-negocio').value).toContain('San José');
    expect(campo<HTMLInputElement>('#ubicacion-negocio').readOnly).toBeTrue();
  });

  it('muestra errores al guardar con campos vacíos', () => {
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
    componente['pin'].set(TIBAS);
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#ubicacion-negocio').value).toContain('Tibás');

    componente['pin'].set(OCEANO);
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#ubicacion-negocio').value).toBe('');
  });

  it('muestra la zona de peligro y confirma la eliminación', () => {
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const eliminar = spyOn(negocioService, 'eliminar').and.callThrough();

    expect(pagina.querySelector('app-zona-peligro')).toBeTruthy();
    expect(pagina.textContent).toContain(DESCRIPCION_ELIMINAR_NEGOCIO);

    boton('Eliminar negocio').click();
    fixture.detectChanges();
    expect(campo('.modal__titulo').textContent).toBe(
      `¿Eliminar Tostadería ${NEGOCIO_EJEMPLO.nombre}?`,
    );
    expect(campo('.modal__aviso').textContent).toContain(AVISO_ELIMINAR_NEGOCIO);
    expect(getComputedStyle(pagina.querySelector('.modal__dialogo')!).backgroundColor).toBe(
      'rgba(8, 28, 38, 0.96)',
    );

    campo<HTMLButtonElement>('.modal__btn--peligro').click();
    fixture.detectChanges();

    expect(eliminar).toHaveBeenCalledWith(NEGOCIO_EJEMPLO.id);
    expect(navegar).toHaveBeenCalledWith(RUTA_DASHBOARD_TOSTADOR);
  });

  it('guarda cambios en el mock del negocio', () => {
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
    expect(campo<HTMLInputElement>('#nombre-negocio').value).toBe('Tostaduría Volcán Sur');
    expect(campo('.avatar__iniciales').textContent!.trim()).toBe('TV');
  });

  it('cancela y restaura el último estado guardado', () => {
    campo<HTMLInputElement>('#nombre-negocio').value = 'Otro nombre';
    campo<HTMLInputElement>('#nombre-negocio').dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#nombre-negocio').value).toBe('Otro nombre');

    boton('Cancelar').click();
    fixture.detectChanges();
    expect(campo<HTMLInputElement>('#nombre-negocio').value).toBe(NEGOCIO_EJEMPLO.nombre);
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
