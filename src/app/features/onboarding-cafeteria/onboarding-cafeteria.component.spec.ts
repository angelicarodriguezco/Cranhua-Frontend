import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NEVER, Observable, of } from 'rxjs';

import { ESTILOS_CAFE } from '../../core/models/cafeteria.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { OnboardingCafeteriaComponent, RUTA_DASHBOARD } from './onboarding-cafeteria.component';

const ESCAZU = { lat: 9.919, lng: -84.1395 };
const LEJOS = { lat: 11.2, lng: -85.6 };

function crear(apiCargada: Observable<boolean>) {
  TestBed.configureTestingModule({
    imports: [OnboardingCafeteriaComponent],
    providers: [provideRouter([]), { provide: GoogleMapsService, useValue: { apiCargada } }],
  });
  const fixture = TestBed.createComponent(OnboardingCafeteriaComponent);
  fixture.detectChanges();
  return fixture;
}

describe('OnboardingCafeteriaComponent', () => {
  let fixture: ComponentFixture<OnboardingCafeteriaComponent>;
  let componente: OnboardingCafeteriaComponent;
  let pagina: HTMLElement;

  beforeEach(() => {
    fixture = crear(NEVER);
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
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

  function clic(texto: string) {
    boton(texto).click();
    fixture.detectChanges();
  }

  function campo(id: string): HTMLInputElement {
    return pagina.querySelector<HTMLInputElement>(`#${id}`)!;
  }

  function pasoActual(): string | null {
    return pagina.querySelector('.pasos')!.getAttribute('aria-label');
  }

  function datos() {
    return componente['formularioDatos'].controls;
  }

  function llenarDatos() {
    componente['formularioDatos'].patchValue({
      nombre: 'Café Brumas',
      contacto: 'Andrés Solano',
      telefono: '+506 8888-1234',
      correo: 'contacto@brumas.cr',
    });
    componente['pin'].set(ESCAZU);
    fixture.detectChanges();
  }

  function llenarPreferencias() {
    componente['formularioPreferencias'].controls.volumenMensual.setValue('25 – 50 kg');
    fixture.detectChanges();
    clic('Claro');
    clic('Medio');
  }

  function irAPreferencias() {
    clic('Empezar a registrar');
    llenarDatos();
    clic('Continuar');
  }

  function registrar() {
    irAPreferencias();
    llenarPreferencias();
    clic('Crear cuenta de cafetería');
  }

  it('recorre los cuatro pasos y el indicador acompaña', () => {
    expect(pasoActual()).toBe('Paso 1 de 4');
    expect(pagina.textContent).toContain('¡Bienvenido, Rodrigo!');

    clic('Empezar a registrar');
    expect(pasoActual()).toBe('Paso 2 de 4');
    expect(pagina.textContent).toContain('Cuéntanos sobre tu cafetería');

    llenarDatos();
    clic('Continuar');
    expect(pasoActual()).toBe('Paso 3 de 4');
    expect(pagina.textContent).toContain('¿Qué estás buscando comprar?');

    llenarPreferencias();
    clic('Crear cuenta de cafetería');
    expect(pasoActual()).toBe('Paso 4 de 4');
    expect(pagina.textContent).toContain('¡Tu cafetería quedó registrada!');
  });

  it('muestra todos los errores del paso 2 si está vacío', () => {
    clic('Empezar a registrar');
    clic('Continuar');

    expect(pasoActual()).toBe('Paso 2 de 4');
    expect(pagina.textContent).toContain('Poné el nombre de tu cafetería.');
    expect(pagina.textContent).toContain('Poné un nombre de contacto.');
    expect(pagina.textContent).toContain('Ingresá un teléfono de 8 dígitos.');
    expect(pagina.textContent).toContain('Ingresá un correo válido.');
    expect(pagina.textContent).toContain('Marcá en el mapa dónde está tu local.');
  });

  const obligatorios: [
    campo: 'nombre' | 'contacto' | 'telefono' | 'correo',
    valor: string,
    error: string,
  ][] = [
    ['nombre', '', 'Poné el nombre de tu cafetería.'],
    ['nombre', '   ', 'Poné el nombre de tu cafetería.'],
    ['contacto', '', 'Poné un nombre de contacto.'],
    ['contacto', '   ', 'Poné un nombre de contacto.'],
    ['telefono', '', 'Ingresá un teléfono de 8 dígitos.'],
    ['correo', '', 'Ingresá un correo válido.'],
    ['correo', 'contacto.brumas.cr', 'Ingresá un correo válido.'],
    ['correo', 'a@b', 'Ingresá un correo válido.'],
  ];

  obligatorios.forEach(([nombre, valor, error]) => {
    it(`no avanza del paso 2 con ${nombre} = "${valor}"`, () => {
      clic('Empezar a registrar');
      llenarDatos();
      datos()[nombre].setValue(valor);
      clic('Continuar');

      expect(pasoActual()).toBe('Paso 2 de 4');
      expect(pagina.textContent).toContain(error);
      expect(campo(`${nombre}-cafeteria`).getAttribute('aria-invalid')).toBe('true');
    });
  });

  it('no avanza del paso 2 sin pin', () => {
    clic('Empezar a registrar');
    llenarDatos();
    componente['pin'].set(null);
    clic('Continuar');

    expect(pasoActual()).toBe('Paso 2 de 4');
    expect(pagina.textContent).toContain('Marcá en el mapa dónde está tu local.');
    expect(campo('ubicacion-cafeteria').getAttribute('aria-invalid')).toBe('true');
  });

  it('valida el teléfono de Costa Rica', () => {
    const telefono = datos().telefono;
    for (const valido of ['88887777', '8888-7777', '+506 8888 7777']) {
      telefono.setValue(valido);
      expect(telefono.valid).withContext(valido).toBeTrue();
    }
    for (const invalido of ['1234', 'abcdefgh', '888877771']) {
      telefono.setValue(invalido);
      expect(telefono.valid).withContext(invalido).toBeFalse();
    }
  });

  it('limita la descripción a 300 caracteres y el horario a 100', () => {
    clic('Empezar a registrar');
    expect(campo('descripcion-cafeteria').maxLength).toBe(300);
    expect(campo('horario-cafeteria').maxLength).toBe(100);

    datos().descripcion.setValue('a'.repeat(300));
    datos().horario.setValue('a'.repeat(100));
    expect(datos().descripcion.valid).toBeTrue();
    expect(datos().horario.valid).toBeTrue();

    datos().descripcion.setValue('a'.repeat(301));
    datos().horario.setValue('a'.repeat(101));
    expect(datos().descripcion.valid).toBeFalse();
    expect(datos().horario.valid).toBeFalse();
  });

  it('muestra el cantón del pin en la ubicación', () => {
    clic('Empezar a registrar');
    llenarDatos();
    expect(campo('ubicacion-cafeteria').value).toBe('Escazú, San José');

    componente['pin'].set({ lat: 9.9335, lng: -84.0775 });
    fixture.detectChanges();
    expect(campo('ubicacion-cafeteria').value).toBe('San José, San José');
  });

  it('avisa si el pin está fuera de los cantones y aun así deja continuar', () => {
    clic('Empezar a registrar');
    llenarDatos();
    componente['pin'].set(LEJOS);
    fixture.detectChanges();

    expect(campo('ubicacion-cafeteria').value).toBe('');
    expect(pagina.textContent).toContain('El pin está fuera de los cantones de ejemplo.');

    clic('Continuar');
    expect(pasoActual()).toBe('Paso 3 de 4');
  });

  it('vuelve a la bienvenida con Atrás desde el paso 2', () => {
    clic('Empezar a registrar');
    clic('Atrás');
    expect(pasoActual()).toBe('Paso 1 de 4');
  });

  it('conserva los datos del paso 2 al volver con Atrás desde el paso 3', () => {
    irAPreferencias();
    clic('Atrás');

    expect(pasoActual()).toBe('Paso 2 de 4');
    expect(campo('nombre-cafeteria').value).toBe('Café Brumas');
    expect(campo('contacto-cafeteria').value).toBe('Andrés Solano');
    expect(campo('telefono-cafeteria').value).toBe('+506 8888-1234');
    expect(campo('correo-cafeteria').value).toBe('contacto@brumas.cr');
    expect(campo('ubicacion-cafeteria').value).toBe('Escazú, San José');
  });

  it('no avanza del paso 3 sin volumen', () => {
    irAPreferencias();
    clic('Oscuro');
    clic('Crear cuenta de cafetería');

    expect(pasoActual()).toBe('Paso 3 de 4');
    expect(pagina.textContent).toContain('Elegí un rango de volumen.');
    expect(pagina.textContent).not.toContain('Elegí al menos un estilo de café.');
  });

  it('no avanza del paso 3 sin estilos', () => {
    irAPreferencias();
    componente['formularioPreferencias'].controls.volumenMensual.setValue('Menos de 10 kg');
    clic('Crear cuenta de cafetería');

    expect(pasoActual()).toBe('Paso 3 de 4');
    expect(pagina.textContent).toContain('Elegí al menos un estilo de café.');
    expect(pagina.textContent).not.toContain('Elegí un rango de volumen.');
  });

  it('ofrece solo los estilos Claro, Medio y Oscuro', () => {
    irAPreferencias();
    const chips = [...pagina.querySelectorAll('.chip')].map((c) => c.textContent?.trim());
    expect(chips).toEqual(['Claro', 'Medio', 'Oscuro']);
    expect([...ESTILOS_CAFE]).toEqual(['Claro', 'Medio', 'Oscuro']);
  });

  it('permite elegir varios estilos', () => {
    irAPreferencias();

    clic('Oscuro');
    clic('Claro');
    expect(boton('Claro').getAttribute('aria-pressed')).toBe('true');
    expect(boton('Oscuro').getAttribute('aria-pressed')).toBe('true');
    expect(boton('Medio').getAttribute('aria-pressed')).toBe('false');
    expect(componente['formularioPreferencias'].controls.estilos.value).toEqual([
      'Claro',
      'Oscuro',
    ]);

    clic('Claro');
    expect(boton('Claro').getAttribute('aria-pressed')).toBe('false');
    expect(componente['formularioPreferencias'].controls.estilos.value).toEqual(['Oscuro']);
  });

  it('muestra los datos en la confirmación y permite editarlos', () => {
    registrar();

    const resumen = pagina.querySelector('.resumen')!.textContent!;
    expect(pagina.textContent).toContain('Café Brumas ya forma parte de Crán̈hua.');
    expect(resumen).toContain('Café Brumas');
    expect(resumen).toContain('Andrés Solano');
    expect(resumen).toContain('Escazú, San José');
    expect(resumen).toContain('25 – 50 kg');
    expect(resumen).toContain('Claro, Medio');

    clic('Editar información');
    expect(pasoActual()).toBe('Paso 2 de 4');
    expect(campo('nombre-cafeteria').value).toBe('Café Brumas');
    expect(campo('correo-cafeteria').value).toBe('contacto@brumas.cr');

    const servicio = TestBed.inject(CafeteriaService);
    spyOn(servicio, 'actualizar').and.callThrough();
    spyOn(servicio, 'registrar').and.callThrough();
    datos().nombre.setValue('Café Brumas Escazú');
    clic('Continuar');
    clic('Guardar cambios');

    expect(servicio.actualizar).toHaveBeenCalled();
    expect(servicio.registrar).not.toHaveBeenCalled();
    expect(pasoActual()).toBe('Paso 4 de 4');
    expect(pagina.querySelector('.resumen')!.textContent).toContain('Café Brumas Escazú');
  });

  it('va al dashboard desde la confirmación', () => {
    registrar();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    clic('Ir a mi dashboard');
    expect(router.navigateByUrl).toHaveBeenCalledWith(RUTA_DASHBOARD);
  });
});

describe('OnboardingCafeteriaComponent sin Google Maps', () => {
  it('avisa que el mapa no cargó y el paso 2 sigue funcionando', () => {
    const fixture = crear(of(false));
    const componente = fixture.componentInstance;
    const pagina: HTMLElement = fixture.nativeElement;
    const clic = (texto: string) => {
      [...pagina.querySelectorAll('button')].find((b) => b.textContent?.includes(texto))!.click();
      fixture.detectChanges();
    };

    clic('Empezar a registrar');
    expect(pagina.textContent).toContain('No se pudo cargar Google Maps.');

    componente['formularioDatos'].patchValue({
      nombre: 'Café Brumas',
      contacto: 'Andrés Solano',
      telefono: '88881234',
      correo: 'contacto@brumas.cr',
    });
    componente['pin'].set(ESCAZU);
    clic('Continuar');
    expect(pagina.querySelector('.pasos')!.getAttribute('aria-label')).toBe('Paso 3 de 4');
  });
});
