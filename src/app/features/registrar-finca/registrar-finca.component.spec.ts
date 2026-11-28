import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { NEVER, of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { Coordenada, DuenoApi, FincaResponseApi } from '../../core/models/finca.model';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { RUTA_DASHBOARD, RegistrarFincaComponent } from './registrar-finca.component';
import { conSesionDeEjemplo } from '../../core/testing/sesion-de-ejemplo';
import { responderCantones } from '../../core/testing/cantones-de-prueba';

const BASE = `${environment.apiUrl}/api/fincas`;

// Cerca de la cabecera de Tarrazú
const LIBRE: Coordenada[] = [
  { lat: 9.67, lng: -84.04 },
  { lat: 9.67, lng: -84.039 },
  { lat: 9.671, lng: -84.039 },
  { lat: 9.671, lng: -84.04 },
];

const RODRIGO: DuenoApi = { id: 'u-rodrigo', nombreCompleto: 'Rodrigo Solís Ureña' };
const MARIA: DuenoApi = { id: 'u-maria', nombreCompleto: 'María Jiménez Solano' };
const ANDRES: DuenoApi = { id: 'u-andres', nombreCompleto: 'Andrés Vargas Quesada' };

function fincaApi(duenos: DuenoApi[] = [RODRIGO]): FincaResponseApi {
  return {
    id: 'f-nueva',
    nombre: 'Finca La Catalina',
    descripcion: null,
    zonaCafetalera: 'Tarrazú',
    perimetro: LIBRE,
    ubicacion: LIBRE[0],
    canton: 'Tarrazú',
    provincia: 'San José',
    areaHectareas: 1.2,
    duenos,
  };
}

describe('RegistrarFincaComponent', () => {
  let fixture: ComponentFixture<RegistrarFincaComponent>;
  let componente: RegistrarFincaComponent;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarFincaComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
        { provide: CafeteriaService, useValue: { obtenerActual: () => of(undefined) } },
      ],
    }).compileComponents();

    conSesionDeEjemplo();
    fixture = TestBed.createComponent(RegistrarFincaComponent);
    responderCantones();
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(CLAVE_TEMA);
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

  function dibujar(perimetro: Coordenada[]) {
    componente['perimetro'].set(perimetro);
    componente['pin'].set(perimetro[0]);
    fixture.detectChanges();
  }

  function llenarYGuardar(perimetro: Coordenada[]) {
    dibujar(perimetro);
    componente['formulario'].controls.nombre.setValue('Finca La Catalina');
    fixture.detectChanges();
    boton('Guardar finca').click();
    fixture.detectChanges();
  }

  function responder(cuerpo: object, status = 201) {
    http.expectOne({ method: 'POST', url: BASE }).flush(cuerpo, { status, statusText: '' });
    fixture.detectChanges();
  }

  function responderConflicto(nombre: string, duenos: DuenoApi[]) {
    responder(
      {
        mensaje: `El terreno se sobrepone con la finca "${nombre}".`,
        conflicto: { fincaId: 'f-otra', nombre, duenos, perimetro: LIBRE },
      },
      409,
    );
  }

  it('muestra el menú del cafetalero y el formulario con la descripción', () => {
    expect(pagina.querySelector('nav')?.textContent).toContain('Mis fincas');
    expect(pagina.querySelector('.perfil-nombre')?.textContent).toBe('Rodrigo Alvarado');
    expect(pagina.querySelector('#descripcion-finca')?.getAttribute('maxlength')).toBe('300');
    expect(pagina.querySelector('#zona-finca')).not.toBeNull();
  });

  it('sigue el tema global oscuro/claro', () => {
    expect(pagina.getAttribute('data-theme')).toBe('claro');
    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
  });

  it('toma el cantón y la provincia del pin', () => {
    expect(pagina.textContent).toContain('Aparece cuando dibujés el perímetro.');
    dibujar(LIBRE);
    expect(pagina.querySelector('.detalles__ubicacion')?.textContent).toContain(
      'Tarrazú, San José',
    );
  });

  it('no guarda sin nombre ni perímetro', () => {
    boton('Guardar finca').click();
    fixture.detectChanges();

    expect(pagina.textContent).toContain('Poné un nombre para tu finca.');
    expect(pagina.textContent).toContain('Marcá al menos tres esquinas en el mapa.');
    expect(pagina.querySelector('.confirmacion')).toBeNull();
    http.expectNone(BASE);
  });

  it('crea la finca y después agrega los dueños; si uno falla la finca queda creada', () => {
    componente['duenos'].set(['maria@ejemplo.cr', 'nadie@ejemplo.cr']);
    llenarYGuardar(LIBRE);

    expect(boton('Guardando…').disabled).toBeTrue();
    responder(fincaApi());
    http.expectOne(`${BASE}/f-nueva/duenos`).flush(fincaApi([RODRIGO, MARIA]));
    http
      .expectOne(`${BASE}/f-nueva/duenos`)
      .flush(
        { mensaje: 'No encontramos una cuenta de cafetalero con ese correo.' },
        { status: 404, statusText: 'Not Found' },
      );
    fixture.detectChanges();

    expect(pagina.querySelector('.resumen')?.textContent).toContain('Rodrigo y María Jiménez');
    expect(pagina.querySelector('.fallidos')?.textContent?.replace(/\s+/g, ' ')).toContain(
      'nadie@ejemplo.cr: No encontramos una cuenta de cafetalero con ese correo.',
    );
  });

  it('muestra los errores por campo del backend en el formulario', () => {
    llenarYGuardar(LIBRE);
    responder(
      { mensaje: 'Revisá los datos ingresados.', errores: { nombre: 'Ingresá el nombre.' } },
      400,
    );

    expect(pagina.querySelector('.confirmacion')).toBeNull();
    expect(pagina.textContent).toContain('Ingresá el nombre.');
    expect(boton('Guardar finca').disabled).toBeFalse();
  });

  describe('superposición', () => {
    function textoConflicto(): string {
      return pagina.querySelector('.conflicto')?.textContent?.replace(/\s+/g, ' ') ?? '';
    }

    it('dice con qué finca se cruza y de quién es, sin ofrecer revisión manual', () => {
      llenarYGuardar(LIBRE);
      responderConflicto('Finca El Tucán', [ANDRES]);

      expect(pagina.querySelector('.aviso')?.textContent).toContain('se sobrepone');
      expect(textoConflicto()).toContain(
        'Tu dibujo se cruza con Finca El Tucán, de Andrés Vargas Quesada.',
      );
      expect(pagina.textContent).not.toContain('revise manualmente');
      expect(boton('Corregir el dibujo')).toBeTruthy();
    });

    it('avisa si la finca en conflicto es del mismo usuario', () => {
      llenarYGuardar(LIBRE);
      responderConflicto('Finca La Esperanza', [RODRIGO]);
      expect(textoConflicto()).toContain('Finca La Esperanza, que ya registraste.');
    });

    it('al corregir borra solo el polígono y se puede registrar de nuevo', () => {
      componente['formulario'].setValue({
        nombre: 'Finca La Catalina',
        descripcion: 'Café de altura',
        zona: 'Tarrazú',
      });
      componente['duenos'].set(['maria@ejemplo.cr']);
      dibujar(LIBRE);
      const pin = componente['pin']();
      boton('Guardar finca').click();
      responderConflicto('Finca El Tucán', [ANDRES]);

      boton('Corregir el dibujo').click();
      fixture.detectChanges();
      expect(pagina.querySelector('.conflicto')).toBeNull();
      expect(pagina.querySelector('.aviso')).toBeNull();
      expect(componente['perimetro']()).toEqual([]);
      expect(componente['formulario'].getRawValue()).toEqual({
        nombre: 'Finca La Catalina',
        descripcion: 'Café de altura',
        zona: 'Tarrazú',
      });
      expect(componente['pin']()).toEqual(pin);
      expect(componente['canton']()?.nombre).toBe('Tarrazú');
      expect(componente['duenos']()).toEqual(['maria@ejemplo.cr']);
      expect(pagina.querySelector<HTMLInputElement>('#nombre-finca')?.value).toBe(
        'Finca La Catalina',
      );

      componente['perimetro'].set(LIBRE);
      fixture.detectChanges();
      boton('Guardar finca').click();
      responder(fincaApi());
      http.expectOne(`${BASE}/f-nueva/duenos`).flush(fincaApi([RODRIGO, MARIA]));
      fixture.detectChanges();
      expect(pagina.querySelector('.resumen')?.textContent).toContain('Finca La Catalina');
    });
  });

  it('muestra el resumen al guardar y va al dashboard', () => {
    llenarYGuardar(LIBRE);
    responder(fincaApi());

    const resumen = pagina.querySelector('.resumen')!.textContent!;
    expect(resumen).toContain('Finca La Catalina');
    expect(resumen).toContain('Tarrazú');
    expect(pagina.querySelector('.encabezado__texto')).toBeNull();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    boton('Ir a mi dashboard').click();
    expect(router.navigateByUrl).toHaveBeenCalledWith(RUTA_DASHBOARD);
  });

  it('reinicia el formulario para registrar otra finca', () => {
    llenarYGuardar(LIBRE);
    responder(fincaApi());
    boton('Registrar otra finca').click();
    fixture.detectChanges();

    expect(componente['perimetro']()).toEqual([]);
    expect(componente['formulario'].controls.nombre.value).toBe('');
    expect(pagina.textContent).toContain('Detalles de tu finca');
  });
});

describe('RegistrarFincaComponent en edición', () => {
  let fixture: ComponentFixture<RegistrarFincaComponent>;
  let componente: RegistrarFincaComponent;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  const GUARDADA: FincaResponseApi = {
    id: 'f-1',
    nombre: 'Finca La Catalina',
    descripcion: 'Café de altura',
    zonaCafetalera: 'Tarrazú',
    perimetro: LIBRE,
    ubicacion: { lat: 9.6705, lng: -84.0395 },
    canton: 'Tarrazú',
    provincia: 'San José',
    areaHectareas: 1.2,
    duenos: [RODRIGO],
  };

  async function abrir(seccion: string | null = null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [RegistrarFincaComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
        { provide: CafeteriaService, useValue: { obtenerActual: () => of(undefined) } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'f-1' }),
              queryParamMap: convertToParamMap(seccion ? { seccion } : {}),
            },
          },
        },
      ],
    }).compileComponents();

    conSesionDeEjemplo();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RegistrarFincaComponent);
    responderCantones();
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  }

  function cargar() {
    http.expectOne({ method: 'GET', url: `${BASE}/f-1` }).flush(GUARDADA);
    fixture.detectChanges();
  }

  function guardar() {
    [...pagina.querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Guardar cambios'))!
      .click();
    fixture.detectChanges();
  }

  afterEach(() => {
    http.verify();
    localStorage.removeItem(CLAVE_TEMA);
  });

  it('carga la finca real en el formulario y no muestra el paso de dueños', async () => {
    await abrir();
    cargar();

    expect(pagina.querySelector('.encabezado__titulo')?.textContent).toBe('Editar finca');
    expect(pagina.querySelector<HTMLInputElement>('#nombre-finca')?.value).toBe(
      'Finca La Catalina',
    );
    expect(pagina.querySelector<HTMLTextAreaElement>('#descripcion-finca')?.value).toBe(
      'Café de altura',
    );
    expect(componente['perimetro']()).toEqual(LIBRE);
    expect(pagina.textContent).not.toContain('Dueños adicionales');
    expect(pagina.textContent).toContain('Guardar cambios');
  });

  it('con ?seccion=perimetro baja hasta el mapa', async () => {
    const scroll = spyOn(Element.prototype, 'scrollIntoView');
    await abrir('perimetro');
    cargar();
    await fixture.whenStable();

    expect(scroll).toHaveBeenCalled();
  });

  it('manda solo los campos cambiados y vuelve al detalle', async () => {
    await abrir();
    cargar();
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    componente['formulario'].controls.nombre.setValue('Finca La Catalina Alta');
    fixture.detectChanges();
    guardar();

    const peticion = http.expectOne({ method: 'PATCH', url: `${BASE}/f-1` });
    expect(peticion.request.withCredentials).toBeTrue();
    expect(peticion.request.body).toEqual({ nombre: 'Finca La Catalina Alta' });
    peticion.flush({ ...GUARDADA, nombre: 'Finca La Catalina Alta' });

    expect(navegar).toHaveBeenCalledWith(['/cafetalero/fincas', 'f-1']);
  });

  it('al cambiar el perímetro lo manda en el PATCH', async () => {
    await abrir();
    cargar();
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    const nuevo = LIBRE.map((p) => ({ lat: p.lat + 0.001, lng: p.lng }));
    componente['perimetro'].set(nuevo);
    fixture.detectChanges();
    guardar();

    const peticion = http.expectOne(`${BASE}/f-1`);
    expect(peticion.request.body).toEqual({ perimetro: nuevo });
    peticion.flush(GUARDADA);
  });

  it('muestra la superposición con los dueños de la otra finca', async () => {
    await abrir();
    cargar();
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    componente['perimetro'].set(LIBRE.map((p) => ({ lat: p.lat, lng: p.lng + 0.001 })));
    fixture.detectChanges();
    guardar();
    http.expectOne(`${BASE}/f-1`).flush(
      {
        mensaje: 'El terreno se sobrepone con la finca "Finca El Tucán".',
        conflicto: {
          fincaId: 'f-tucan',
          nombre: 'Finca El Tucán',
          duenos: [ANDRES],
          perimetro: LIBRE,
        },
      },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(navegar).not.toHaveBeenCalled();
    expect(pagina.querySelector('.aviso')?.textContent).toContain('se sobrepone');
    expect(pagina.querySelector('.conflicto')?.textContent?.replace(/\s+/g, ' ')).toContain(
      'Tu dibujo se cruza con Finca El Tucán, de Andrés Vargas Quesada.',
    );
  });

  it('pone los errores 400 bajo su campo y el resto como mensaje general', async () => {
    await abrir();
    cargar();

    componente['formulario'].controls.nombre.setValue('Otra');
    fixture.detectChanges();
    guardar();
    http.expectOne(`${BASE}/f-1`).flush(
      {
        mensaje: 'Revisá los datos ingresados.',
        errores: { nombre: 'Ese nombre ya lo usás.', canton: 'Ingresá el cantón.' },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    const campoNombre = pagina.querySelector('#nombre-finca')!.parentElement!;
    expect(campoNombre.querySelector('.campo__error')?.textContent).toContain(
      'Ese nombre ya lo usás.',
    );
    const generales = pagina.querySelector('ul.campo__error')?.textContent;
    expect(generales).toContain('Ingresá el cantón.');
    expect(generales).not.toContain('Ese nombre ya lo usás.');
  });

  it('si no es dueño muestra el mensaje y el enlace a Mis fincas', async () => {
    await abrir();
    http
      .expectOne(`${BASE}/f-1`)
      .flush(
        { mensaje: 'Solo un dueño de la finca puede verla.' },
        { status: 403, statusText: 'Forbidden' },
      );
    fixture.detectChanges();

    expect(pagina.querySelector('.sin-acceso')?.textContent).toContain(
      'Solo un dueño de la finca puede verla.',
    );
    expect(pagina.querySelector('.sin-acceso a')?.getAttribute('href')).toBe('/cafetalero/fincas');
    expect(pagina.querySelector('app-formulario-finca')).toBeNull();
  });
});
