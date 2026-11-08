import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';

import { environment } from '../../../environments/environment';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { SesionService } from '../../core/services/sesion.service';
import { USUARIOS } from '../../core/mocks/finca.mock';
import { Coordenada, DuenoApi, FincaResponseApi } from '../../core/models/finca.model';
import { OnboardingFincaComponent, RUTA_DASHBOARD } from './onboarding-finca.component';

const BASE = `${environment.apiUrl}/api/fincas`;

const LIBRE: Coordenada[] = [
  { lat: 9.7, lng: -84.1 },
  { lat: 9.7, lng: -84.099 },
  { lat: 9.701, lng: -84.099 },
  { lat: 9.701, lng: -84.1 },
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

describe('OnboardingFincaComponent', () => {
  let fixture: ComponentFixture<OnboardingFincaComponent>;
  let componente: OnboardingFincaComponent;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingFincaComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingFincaComponent);
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

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

  function llenarYGuardar(perimetro: Coordenada[]) {
    componente['perimetro'].set(perimetro);
    componente['pin'].set(perimetro[0]);
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

  it('da la bienvenida con el nombre del usuario', () => {
    expect(pagina.textContent).toContain('¡Bienvenido, Rodrigo!');
    expect(pasoActual()).toBe('Paso 1 de 4');
  });

  it('usa el nombre de quien haya iniciado sesión', () => {
    TestBed.inject(SesionService).iniciarSesion(USUARIOS[3]);
    fixture.detectChanges();
    expect(pagina.querySelector('.titulo')?.textContent).toBe('¡Bienvenido, Lucía!');
    expect(pagina.querySelector('.avatar')?.textContent).toBe('L');
  });

  it('pasa al mapa y vuelve a la bienvenida', () => {
    boton('Empezar a dibujar').click();
    fixture.detectChanges();
    expect(pasoActual()).toBe('Paso 2 de 4');
    expect(pagina.textContent).toContain('Detalles de tu finca');

    boton('Volver').click();
    fixture.detectChanges();
    expect(pasoActual()).toBe('Paso 1 de 4');
  });

  it('no guarda sin nombre ni perímetro', () => {
    boton('Empezar a dibujar').click();
    fixture.detectChanges();
    boton('Guardar finca').click();
    fixture.detectChanges();

    expect(pasoActual()).toBe('Paso 2 de 4');
    expect(pagina.textContent).toContain('Poné un nombre para tu finca.');
    expect(pagina.textContent).toContain('Marcá al menos tres esquinas en el mapa.');
    http.expectNone(BASE);
  });

  describe('dueños adicionales', () => {
    beforeEach(() => {
      boton('Empezar a dibujar').click();
      fixture.detectChanges();
    });

    function agregarCorreo(correo: string) {
      boton('+ Agregar dueño por correo').click();
      fixture.detectChanges();
      const campo = pagina.querySelector<HTMLInputElement>('input[type="email"]')!;
      campo.value = correo;
      campo.dispatchEvent(new Event('input'));
      boton('Agregar').click();
      fixture.detectChanges();
    }

    it('solo valida el formato del correo', () => {
      agregarCorreo('maria@ejemplo');
      expect(pagina.textContent).toContain('Ingresá un correo válido.');
      expect(componente['duenos']()).toEqual([]);

      boton('Cancelar').click();
      fixture.detectChanges();
      agregarCorreo('alguien@ejemplo.cr');
      expect(componente['duenos']()).toEqual(['alguien@ejemplo.cr']);
      expect(pagina.querySelector('.dueno__nombre')?.textContent).toBe('alguien@ejemplo.cr');
    });

    it('crea la finca y después agrega los dueños; si uno falla la finca queda creada', () => {
      componente['duenos'].set(['maria@ejemplo.cr', 'nadie@ejemplo.cr']);
      llenarYGuardar(LIBRE);

      expect(boton('Guardando…').disabled).toBeTrue();
      responder(fincaApi());

      const primero = http.expectOne(`${BASE}/f-nueva/duenos`);
      expect(primero.request.body).toEqual({ correo: 'maria@ejemplo.cr' });
      primero.flush(fincaApi([RODRIGO, MARIA]));

      http
        .expectOne(`${BASE}/f-nueva/duenos`)
        .flush(
          { mensaje: 'No encontramos una cuenta de cafetalero con ese correo.' },
          { status: 404, statusText: 'Not Found' },
        );
      fixture.detectChanges();

      expect(pasoActual()).toBe('Paso 4 de 4');
      expect(pagina.querySelector('.resumen')?.textContent).toContain('Rodrigo y María Jiménez');
      expect(pagina.querySelector('.fallidos')?.textContent?.replace(/\s+/g, ' ')).toContain(
        'nadie@ejemplo.cr: No encontramos una cuenta de cafetalero con ese correo.',
      );
    });
  });

  it('muestra los errores por campo del backend en el formulario', () => {
    boton('Empezar a dibujar').click();
    fixture.detectChanges();
    llenarYGuardar(LIBRE);
    responder(
      { mensaje: 'Revisá los datos ingresados.', errores: { canton: 'Ingresá el cantón.' } },
      400,
    );

    expect(pasoActual()).toBe('Paso 2 de 4');
    expect(pagina.textContent).toContain('Ingresá el cantón.');
    expect(boton('Guardar finca').disabled).toBeFalse();
  });

  it('muestra un error genérico si falla la conexión', () => {
    boton('Empezar a dibujar').click();
    fixture.detectChanges();
    llenarYGuardar(LIBRE);
    http.expectOne(BASE).error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(pagina.textContent).toContain('No pudimos registrar la finca. Intentá de nuevo.');
  });

  describe('superposición', () => {
    beforeEach(() => {
      boton('Empezar a dibujar').click();
      fixture.detectChanges();
    });

    function textoConflicto(): string {
      return pagina.querySelector('.conflicto')?.textContent?.replace(/\s+/g, ' ') ?? '';
    }

    it('dice con qué finca se cruza y de quién es, sin ofrecer revisión manual', () => {
      llenarYGuardar(LIBRE);
      responderConflicto('Finca El Tucán', [ANDRES]);

      expect(pasoActual()).toBe('Paso 3 de 4');
      expect(pagina.querySelector('.aviso')?.textContent).toContain('se sobrepone');
      expect(textoConflicto()).toContain(
        'Tu dibujo se cruza con Finca El Tucán, de Andrés Vargas Quesada.',
      );
      expect(pagina.textContent).not.toContain('revise manualmente');

      pagina.querySelector<HTMLButtonElement>('.aviso__cerrar')!.click();
      fixture.detectChanges();
      expect(pagina.querySelector('.aviso')).toBeNull();
      expect(boton('Corregir el dibujo')).toBeTruthy();
    });

    it('une a los dueños con "y" en el orden del backend', () => {
      llenarYGuardar(LIBRE);
      responderConflicto('Finca Las Brisas', [
        ANDRES,
        { id: 'u-lucia', nombreCompleto: 'Lucía Mora Castro' },
      ]);
      expect(textoConflicto()).toContain('de Andrés Vargas Quesada y Lucía Mora Castro.');
    });

    it('avisa si la finca en conflicto es del mismo usuario, comparando por id', () => {
      llenarYGuardar(LIBRE);
      responderConflicto('Finca La Esperanza', [RODRIGO]);
      expect(textoConflicto()).toContain('Finca La Esperanza, que ya registraste.');

      boton('Corregir el dibujo').click();
      llenarYGuardar(LIBRE);
      responderConflicto('Finca El Tucán', [{ ...RODRIGO, id: 'u-otro-rodrigo' }]);
      expect(textoConflicto()).not.toContain('que ya registraste');
    });

    it('al corregir borra solo el polígono y se puede registrar de nuevo', () => {
      componente['formulario'].setValue({
        nombre: 'Finca La Catalina',
        descripcion: 'Café de altura',
        zona: 'Tarrazú',
      });
      componente['duenos'].set(['maria@ejemplo.cr']);
      componente['perimetro'].set(LIBRE);
      componente['pin'].set({ lat: 9.66, lng: -84.03 });
      fixture.detectChanges();
      boton('Guardar finca').click();
      responderConflicto('Finca El Tucán', [ANDRES]);

      boton('Corregir el dibujo').click();
      fixture.detectChanges();
      expect(pasoActual()).toBe('Paso 2 de 4');
      expect(pagina.querySelector('.aviso')).toBeNull();
      expect(componente['perimetro']()).toEqual([]);
      expect(componente['formulario'].getRawValue()).toEqual({
        nombre: 'Finca La Catalina',
        descripcion: 'Café de altura',
        zona: 'Tarrazú',
      });
      expect(componente['pin']()).toEqual({ lat: 9.66, lng: -84.03 });
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
      expect(pasoActual()).toBe('Paso 4 de 4');
    });
  });

  it('muestra el resumen al guardar y va al dashboard', () => {
    boton('Empezar a dibujar').click();
    fixture.detectChanges();
    componente['formulario'].controls.zona.setValue('Tarrazú');
    llenarYGuardar(LIBRE);
    responder(fincaApi());

    expect(pasoActual()).toBe('Paso 4 de 4');
    const resumen = pagina.querySelector('.resumen')!.textContent!;
    expect(resumen).toContain('Finca La Catalina');
    expect(resumen).toContain('Tarrazú');
    expect(resumen).toContain('hectáreas');
    expect(pagina.querySelector('.fallidos')).toBeNull();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    boton('Ir a mi dashboard').click();
    expect(router.navigateByUrl).toHaveBeenCalledWith(RUTA_DASHBOARD);
  });

  it('reinicia el flujo para registrar otra finca', () => {
    boton('Empezar a dibujar').click();
    fixture.detectChanges();
    llenarYGuardar(LIBRE);
    responder(fincaApi());

    boton('Registrar otra finca').click();
    fixture.detectChanges();

    expect(pasoActual()).toBe('Paso 2 de 4');
    expect(componente['perimetro']()).toEqual([]);
    expect(componente['formulario'].controls.nombre.value).toBe('');
  });
});
