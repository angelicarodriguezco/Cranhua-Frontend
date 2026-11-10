import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CAFETERIA_ACTUAL } from '../../core/mocks/cafeteria.mock';
import { CafeteriaResponseApi } from '../../core/models/cafeteria.model';
import { Coordenada } from '../../core/models/finca.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { CLAVE_TEMA } from '../../core/services/tema.service';
import { RegistrarCafeteriaComponent } from './registrar-cafeteria.component';

const BASE = `${environment.apiUrl}/api/cafeterias`;
const ESCAZU: Coordenada = { lat: 9.9189, lng: -84.1397 };
const OCEANO: Coordenada = { lat: 8.5, lng: -86.5 };

function cafeteriaApi(cambios: Partial<CafeteriaResponseApi> = {}): CafeteriaResponseApi {
  return {
    id: 'c-cafe-montana',
    cuentaId: CAFETERIA_ACTUAL.id,
    nombre: 'Café Montaña',
    nombreContacto: 'Andrés Solano',
    telefono: '+506 8899-4410',
    correo: 'hola@cafemontana.cr',
    descripcion: null,
    horario: null,
    ubicacion: ESCAZU,
    canton: 'Escazú',
    provincia: 'San José',
    estilos: ['MEDIO'],
    volumenMensual: null,
    portadaUrl: null,
    ...cambios,
  };
}

describe('RegistrarCafeteriaComponent', () => {
  let fixture: ComponentFixture<RegistrarCafeteriaComponent>;
  let componente: RegistrarCafeteriaComponent;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarCafeteriaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarCafeteriaComponent);
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    sinCafeteria();
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(CLAVE_TEMA);
  });

  function sinCafeteria(): void {
    http.expectOne({ method: 'GET', url: `${BASE}/actual` }).flush(null, {
      status: 404,
      statusText: 'Not Found',
    });
    fixture.detectChanges();
  }

  function campo<T extends HTMLElement>(selector: string): T {
    return pagina.querySelector<T>(selector)!;
  }

  function boton(texto: string): HTMLButtonElement {
    const encontrado = [...pagina.querySelectorAll<HTMLButtonElement>('main button')].find((b) =>
      b.textContent?.includes(texto),
    );
    if (!encontrado) {
      throw new Error(`No hay botón "${texto}"`);
    }
    return encontrado;
  }

  function escribir(selector: string, valor: string): void {
    const control = campo<HTMLInputElement | HTMLTextAreaElement>(selector);
    control.value = valor;
    control.dispatchEvent(new Event('input'));
  }

  function enlacesMenu(): string[] {
    return [...pagina.querySelectorAll('app-menu-lateral [data-rol="cafeteria"] a')].map((a) =>
      a.textContent!.trim(),
    );
  }

  function errores(): string[] {
    return [...pagina.querySelectorAll('.campo__error')].map((e) => e.textContent!.trim());
  }

  function abrirFormulario(): void {
    boton('Registrar cafetería').click();
    fixture.detectChanges();
  }

  function completarObligatorios(): void {
    escribir('#nombre-cafeteria', 'Café Montaña');
    escribir('#contacto-cafeteria', 'Andrés Solano');
    escribir('#telefono-cafeteria', '88994410');
    escribir('#correo-cafeteria', 'hola@cafemontana.cr');
    componente['pin'].set(ESCAZU);
    boton('Medio').click();
    fixture.detectChanges();
  }

  function responder(cuerpo: object, status = 201): void {
    http.expectOne({ method: 'POST', url: BASE }).flush(cuerpo, { status, statusText: '' });
    fixture.detectChanges();
  }

  it('muestra la pantalla vacía con el menú lateral reducido', () => {
    expect(campo('h1').textContent).toContain('Todavía no tenés una cafetería registrada');
    expect(boton('Registrar cafetería')).toBeTruthy();
    expect(campo('form')).toBeNull();
    expect(enlacesMenu()).toEqual(['Registrar cafetería']);
    expect(campo('.perfil-rol').textContent).toContain('Cafetería');
  });

  it('abre el formulario con todos los campos y solo los estilos claro, medio y oscuro', () => {
    abrirFormulario();

    for (const id of [
      'nombre',
      'contacto',
      'descripcion',
      'horario',
      'telefono',
      'correo',
      'ubicacion',
    ]) {
      expect(campo(`#${id}-cafeteria`))
        .withContext(id)
        .not.toBeNull();
    }
    expect(campo('app-mapa-cafeteria')).not.toBeNull();
    const estilos = [...pagina.querySelectorAll('.estilo')].map((e) => e.textContent!.trim());
    expect(estilos).toEqual(['Claro', 'Medio', 'Oscuro']);
    expect(campo('#descripcion-cafeteria').getAttribute('maxlength')).toBe('300');
    expect(campo('#horario-cafeteria').getAttribute('maxlength')).toBe('100');
  });

  it('permite elegir varios estilos y quitarlos', () => {
    abrirFormulario();

    boton('Oscuro').click();
    boton('Claro').click();
    fixture.detectChanges();
    expect(componente['estilos'].value).toEqual(['Claro', 'Oscuro']);

    boton('Oscuro').click();
    fixture.detectChanges();
    expect(componente['estilos'].value).toEqual(['Claro']);
  });

  it('toma el cantón y la provincia del pin', () => {
    abrirFormulario();

    componente['pin'].set(ESCAZU);
    fixture.detectChanges();

    expect(campo<HTMLInputElement>('#ubicacion-cafeteria').value).toBe('Escazú, San José');
  });

  it('no registra si faltan campos obligatorios', () => {
    const registrar = spyOn(TestBed.inject(CafeteriaService), 'registrarActual').and.callThrough();
    abrirFormulario();

    boton('Registrar cafetería').click();
    fixture.detectChanges();

    expect(registrar).not.toHaveBeenCalled();
    expect(errores()).toEqual([
      'Poné el nombre de tu cafetería.',
      'Poné un nombre de contacto.',
      'Poné un teléfono de contacto.',
      'Poné un correo de contacto.',
      'Marcá en el mapa dónde está tu local.',
      'Elegí al menos un estilo de café.',
    ]);
  });

  it('no registra si el pin queda fuera de los cantones', () => {
    abrirFormulario();
    completarObligatorios();
    componente['pin'].set(OCEANO);

    boton('Registrar cafetería').click();
    fixture.detectChanges();

    http.expectNone({ method: 'POST', url: BASE });
    expect(errores()).toContain(
      'El pin está fuera de los cantones de ejemplo. Movelo más cerca de tu local.',
    );
  });

  it('registra la cafetería para la cuenta actual y navega al dashboard', () => {
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    abrirFormulario();
    completarObligatorios();

    boton('Registrar cafetería').click();
    const peticion = http.expectOne({ method: 'POST', url: BASE });
    expect(peticion.request.body).toEqual(
      jasmine.objectContaining({
        nombre: 'Café Montaña',
        nombreContacto: 'Andrés Solano',
        telefono: '+506 8899-4410',
        correo: 'hola@cafemontana.cr',
        descripcion: null,
        horario: null,
        canton: 'Escazú',
        provincia: 'San José',
        estilos: ['MEDIO'],
        volumenMensual: null,
      }),
    );
    peticion.flush(cafeteriaApi());
    fixture.detectChanges();

    expect(navegar).toHaveBeenCalledWith('/cafeteria/dashboard');
  });

  it('muestra los errores por campo del backend en el formulario', () => {
    abrirFormulario();
    completarObligatorios();

    boton('Registrar cafetería').click();
    responder(
      { mensaje: 'Revisá los datos ingresados.', errores: { canton: 'Ingresá el cantón.' } },
      400,
    );

    expect(pagina.textContent).toContain('Ingresá el cantón.');
    expect(boton('Registrar cafetería').disabled).toBeFalse();
  });

  it('muestra el mensaje genérico del backend si no hay errores por campo', () => {
    abrirFormulario();
    completarObligatorios();

    boton('Registrar cafetería').click();
    responder({ mensaje: 'No tenés permiso para registrar una cafetería.' }, 400);

    expect(pagina.textContent).toContain('No tenés permiso para registrar una cafetería.');
    expect(boton('Registrar cafetería').disabled).toBeFalse();
  });

  it('cancelar vuelve a la pantalla vacía y limpia el formulario', () => {
    abrirFormulario();
    completarObligatorios();

    boton('Cancelar').click();
    fixture.detectChanges();

    expect(campo('form')).toBeNull();
    expect(campo('h1').textContent).toContain('Todavía no tenés una cafetería registrada');

    abrirFormulario();
    expect(campo<HTMLInputElement>('#nombre-cafeteria').value).toBe('');
    expect(campo<HTMLInputElement>('#ubicacion-cafeteria').value).toBe('');
    expect(pagina.querySelector('.estilo--activo')).toBeNull();
  });

  it('sigue el tema global claro/oscuro', () => {
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');

    TestBed.inject(DashboardCafeteriaService).alternarTema();
    fixture.detectChanges();

    expect(pagina.getAttribute('data-theme')).toBe('claro');
  });
});
