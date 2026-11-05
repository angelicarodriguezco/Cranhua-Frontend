import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NEVER } from 'rxjs';

import { CAFETERIA_ACTUAL, CAFETERIA_EJEMPLO } from '../../core/mocks/cafeteria.mock';
import { Cafeteria } from '../../core/models/cafeteria.model';
import { Coordenada } from '../../core/models/finca.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { CLAVE_TEMA } from '../../core/services/tema.service';
import { RegistrarCafeteriaComponent } from './registrar-cafeteria.component';

const ESCAZU: Coordenada = { lat: 9.9189, lng: -84.1397 };
const OCEANO: Coordenada = { lat: 8.5, lng: -86.5 };

describe('RegistrarCafeteriaComponent', () => {
  let fixture: ComponentFixture<RegistrarCafeteriaComponent>;
  let componente: RegistrarCafeteriaComponent;
  let pagina: HTMLElement;
  let cafeteriaService: CafeteriaService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarCafeteriaComponent],
      providers: [
        provideRouter([]),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
      ],
    }).compileComponents();

    cafeteriaService = TestBed.inject(CafeteriaService);
    cafeteriaService.eliminar(CAFETERIA_EJEMPLO.id).subscribe();
    fixture = TestBed.createComponent(RegistrarCafeteriaComponent);
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

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
    return [...pagina.querySelectorAll('app-menu-lateral-cafeteria nav a')].map((a) =>
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

  it('muestra la pantalla vacía con el menú lateral reducido', () => {
    expect(campo('h1').textContent).toContain('Todavía no tenés una cafetería registrada');
    expect(boton('Registrar cafetería')).toBeTruthy();
    expect(campo('form')).toBeNull();
    expect(enlacesMenu()).toEqual(['Registrar cafetería', 'Perfil y ajustes', 'Cerrar sesión']);
    expect(campo('.perfil-rol').textContent!.trim()).toBe('Cafetería');
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
    const registrar = spyOn(cafeteriaService, 'registrarActual').and.callThrough();
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
    const registrar = spyOn(cafeteriaService, 'registrarActual');
    abrirFormulario();
    completarObligatorios();
    componente['pin'].set(OCEANO);

    boton('Registrar cafetería').click();
    fixture.detectChanges();

    expect(registrar).not.toHaveBeenCalled();
    expect(errores()).toContain(
      'El pin está fuera de los cantones de ejemplo. Movelo más cerca de tu local.',
    );
  });

  it('registra la cafetería para la cuenta actual y navega al dashboard', () => {
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    abrirFormulario();
    completarObligatorios();

    boton('Registrar cafetería').click();

    expect(navegar).toHaveBeenCalledWith('/cafeteria/dashboard');
    let registrada: Cafeteria | undefined;
    cafeteriaService.obtenerActual().subscribe((c) => (registrada = c));
    expect(registrada).toEqual(
      jasmine.objectContaining({
        nombre: 'Café Montaña',
        telefono: '+506 8899-4410',
        descripcion: null,
        horario: null,
        canton: jasmine.objectContaining({ nombre: 'Escazú', provincia: 'San José' }),
        estilos: ['Medio'],
        propietarioId: CAFETERIA_ACTUAL.id,
      }),
    );
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
