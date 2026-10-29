import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';

import { GoogleMapsService } from '../../core/services/google-maps.service';
import { Coordenada } from '../../core/models/negocio-tueste.model';
import {
  OnboardingTostadorComponent,
  RUTA_DASHBOARD_TOSTADOR,
} from './onboarding-tostador.component';

const TIBAS: Coordenada = { lat: 9.959, lng: -84.082 };
const OCEANO: Coordenada = { lat: 8.5, lng: -86.5 };

describe('OnboardingTostadorComponent', () => {
  let fixture: ComponentFixture<OnboardingTostadorComponent>;
  let componente: OnboardingTostadorComponent;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingTostadorComponent],
      providers: [
        provideRouter([]),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingTostadorComponent);
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.detectChanges();
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

  it('da la bienvenida con el nombre del tostador', () => {
    expect(pagina.textContent).toContain('Mariana');
    expect(pagina.querySelector('.avatar')?.textContent).toBe('M');
    expect(pasoActual()).toBe('Paso 1 de 3');
  });

  it('pasa al formulario y vuelve a la bienvenida', () => {
    clic('Empezar a registrar');
    expect(pasoActual()).toBe('Paso 2 de 3');
    expect(pagina.textContent).toContain('Registrá tu negocio de tueste');

    clic('Volver');
    expect(pasoActual()).toBe('Paso 1 de 3');
  });

  it('no crea la cuenta con los campos obligatorios vacíos', () => {
    clic('Empezar a registrar');
    clic('Crear cuenta de tostador');

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

  it('muestra el resumen y va al dashboard del tostador', () => {
    clic('Empezar a registrar');
    llenar();
    clic('Crear cuenta de tostador');

    expect(pasoActual()).toBe('Paso 3 de 3');
    const resumen = pagina.querySelector('.resumen')!.textContent!;
    expect(resumen).toContain('Tostaduría Volcán');
    expect(resumen).toContain('Mariana Castro');
    expect(resumen).toContain('Tibás, San José');
    expect(resumen).toContain('Claro y Medio');
    expect(componente['registrado']()?.telefono).toBe('+506 8888-1234');

    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    clic('Ir a mi dashboard');
    expect(router.navigateByUrl).toHaveBeenCalledWith(RUTA_DASHBOARD_TOSTADOR);
  });

  it('vuelve al formulario con los datos para editarlos', () => {
    clic('Empezar a registrar');
    llenar();
    clic('Crear cuenta de tostador');
    const id = componente['registrado']()!.id;

    clic('Editar información');
    expect(pasoActual()).toBe('Paso 2 de 3');
    expect(pagina.querySelector<HTMLInputElement>('#nombre-negocio')!.value).toBe(
      'Tostaduría Volcán',
    );

    componente['formulario'].controls.nombre.setValue('Volcán Tostadores');
    clic('Guardar cambios');

    expect(pasoActual()).toBe('Paso 3 de 3');
    expect(componente['registrado']()).toEqual(
      jasmine.objectContaining({ id, nombre: 'Volcán Tostadores' }),
    );
  });

  it('descarta los cambios al cancelar la edición', () => {
    clic('Empezar a registrar');
    llenar();
    clic('Crear cuenta de tostador');

    clic('Editar información');
    componente['formulario'].controls.nombre.setValue('Otro nombre');
    clic('Cancelar');

    expect(pasoActual()).toBe('Paso 3 de 3');
    expect(componente['formulario'].controls.nombre.value).toBe('Tostaduría Volcán');
  });
});
