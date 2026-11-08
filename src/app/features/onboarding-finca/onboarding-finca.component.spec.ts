import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';

import { GoogleMapsService } from '../../core/services/google-maps.service';
import { SesionService } from '../../core/services/sesion.service';
import { FINCAS_REGISTRADAS, USUARIOS } from '../../core/mocks/finca.mock';
import { Coordenada } from '../../core/models/finca.model';
import { FincaService } from '../../core/services/finca.service';
import { OnboardingFincaComponent, RUTA_DASHBOARD } from './onboarding-finca.component';

const LIBRE: Coordenada[] = [
  { lat: 9.7, lng: -84.1 },
  { lat: 9.7, lng: -84.099 },
  { lat: 9.701, lng: -84.099 },
  { lat: 9.701, lng: -84.1 },
];

describe('OnboardingFincaComponent', () => {
  let fixture: ComponentFixture<OnboardingFincaComponent>;
  let componente: OnboardingFincaComponent;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingFincaComponent],
      providers: [
        provideRouter([]),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingFincaComponent);
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

  function llenarYGuardar(perimetro: Coordenada[]) {
    componente['perimetro'].set(perimetro);
    componente['pin'].set(perimetro[0]);
    componente['formulario'].controls.nombre.setValue('Finca La Catalina');
    fixture.detectChanges();
    boton('Guardar finca').click();
    fixture.detectChanges();
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
  });

  describe('superposición', () => {
    const tucan = FINCAS_REGISTRADAS.find((f) => f.id === 'f-el-tucan')!;

    beforeEach(() => {
      boton('Empezar a dibujar').click();
      fixture.detectChanges();
    });

    function textoConflicto(): string {
      return pagina.querySelector('.conflicto')?.textContent?.replace(/\s+/g, ' ') ?? '';
    }

    it('dice con qué finca se cruza y de quién es, sin ofrecer revisión manual', () => {
      llenarYGuardar(tucan.perimetro);

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

    it('ordena a los dueños por nombre y los une con "y"', () => {
      const brisas = FINCAS_REGISTRADAS.find((f) => f.id === 'f-las-brisas')!;
      TestBed.inject(FincaService).agregarDueno(brisas.id, 'andres.vargas@ejemplo.cr').subscribe();
      llenarYGuardar(brisas.perimetro);

      expect(textoConflicto()).toContain('de Andrés Vargas Quesada y Lucía Mora Castro.');
    });

    it('avisa si la finca en conflicto es del mismo usuario', () => {
      llenarYGuardar(FINCAS_REGISTRADAS.find((f) => f.id === 'f-la-esperanza')!.perimetro);
      expect(textoConflicto()).toContain('Finca La Esperanza, que ya registraste.');
    });

    it('solo cuenta como propia si coincide el id, aunque el nombre sea igual', () => {
      const sesion = TestBed.inject(SesionService);
      sesion.iniciarSesion({ ...USUARIOS[2], id: 'u-otro-andres', correo: 'otro.cr' });
      llenarYGuardar(tucan.perimetro);
      expect(textoConflicto()).toContain('Finca El Tucán, de Andrés Vargas Quesada.');
      expect(textoConflicto()).not.toContain('que ya registraste');

      boton('Corregir el dibujo').click();
      sesion.iniciarSesion(USUARIOS[2]);
      llenarYGuardar(tucan.perimetro);
      expect(textoConflicto()).toContain('Finca El Tucán, que ya registraste.');
    });

    it('no guarda la finca', () => {
      const servicio = TestBed.inject(FincaService);
      llenarYGuardar(tucan.perimetro);

      let fincas = 0;
      servicio.misFincas(componente['usuario']()!.id).subscribe((f) => (fincas = f.length));
      expect(fincas).toBe(2);
      expect(pasoActual()).toBe('Paso 3 de 4');
    });

    it('al corregir borra solo el polígono y se puede registrar de nuevo', () => {
      componente['formulario'].setValue({
        nombre: 'Finca La Catalina',
        descripcion: 'Café de altura',
        zona: 'Tarrazú',
      });
      componente['duenos'].set([USUARIOS[1]]);
      componente['perimetro'].set(tucan.perimetro);
      componente['pin'].set(tucan.perimetro[0]);
      fixture.detectChanges();
      boton('Guardar finca').click();
      fixture.detectChanges();

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
      expect(componente['pin']()).toEqual(tucan.perimetro[0]);
      expect(componente['canton']()?.nombre).toBe('Tarrazú');
      expect(componente['duenos']()).toEqual([USUARIOS[1]]);
      expect(pagina.querySelector<HTMLInputElement>('#nombre-finca')?.value).toBe(
        'Finca La Catalina',
      );

      componente['perimetro'].set(LIBRE);
      fixture.detectChanges();
      boton('Guardar finca').click();
      fixture.detectChanges();
      expect(pasoActual()).toBe('Paso 4 de 4');
    });
  });

  it('muestra el resumen al guardar y va al dashboard', () => {
    boton('Empezar a dibujar').click();
    fixture.detectChanges();
    componente['duenos'].set([USUARIOS[1]]);
    componente['formulario'].controls.zona.setValue('Tarrazú');
    llenarYGuardar(LIBRE);

    expect(pasoActual()).toBe('Paso 4 de 4');
    const resumen = pagina.querySelector('.resumen')!.textContent!;
    expect(resumen).toContain('Finca La Catalina');
    expect(resumen).toContain('Tarrazú');
    expect(resumen).toContain('hectáreas');
    expect(resumen).toContain('Rodrigo y María Jiménez');

    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    boton('Ir a mi dashboard').click();
    expect(router.navigateByUrl).toHaveBeenCalledWith(RUTA_DASHBOARD);
  });

  it('reinicia el flujo para registrar otra finca', () => {
    boton('Empezar a dibujar').click();
    fixture.detectChanges();
    llenarYGuardar(LIBRE);

    boton('Registrar otra finca').click();
    fixture.detectChanges();

    expect(pasoActual()).toBe('Paso 2 de 4');
    expect(componente['perimetro']()).toEqual([]);
    expect(componente['formulario'].controls.nombre.value).toBe('');
  });
});
