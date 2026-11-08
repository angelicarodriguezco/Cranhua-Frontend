import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';

import { GoogleMapsService } from '../../core/services/google-maps.service';
import { FINCAS_REGISTRADAS, USUARIOS } from '../../core/mocks/finca.mock';
import { Coordenada } from '../../core/models/finca.model';
import { FincaService } from '../../core/services/finca.service';
import { SesionService } from '../../core/services/sesion.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { RUTA_DASHBOARD, RegistrarFincaComponent } from './registrar-finca.component';

// Cerca de la cabecera de Tarrazú y lejos de las fincas de ejemplo
const LIBRE: Coordenada[] = [
  { lat: 9.67, lng: -84.04 },
  { lat: 9.67, lng: -84.039 },
  { lat: 9.671, lng: -84.039 },
  { lat: 9.671, lng: -84.04 },
];

describe('RegistrarFincaComponent', () => {
  let fixture: ComponentFixture<RegistrarFincaComponent>;
  let componente: RegistrarFincaComponent;
  let pagina: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarFincaComponent],
      providers: [
        provideRouter([]),
        { provide: GoogleMapsService, useValue: { apiCargada: NEVER } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarFincaComponent);
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

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

  it('muestra el menú del cafetalero y el formulario con la descripción', () => {
    expect(pagina.querySelector('nav')?.textContent).toContain('Mis fincas');
    expect(pagina.querySelector('.perfil-nombre')?.textContent).toBe('Rodrigo Alvarado');
    expect(pagina.querySelector('#descripcion-finca')?.getAttribute('maxlength')).toBe('300');
    expect(pagina.querySelector('#zona-finca')).not.toBeNull();
  });

  it('sigue el tema global oscuro/claro', () => {
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(pagina.getAttribute('data-theme')).toBe('claro');
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
  });

  describe('superposición', () => {
    const tucan = FINCAS_REGISTRADAS.find((f) => f.id === 'f-el-tucan')!;

    function textoConflicto(): string {
      return pagina.querySelector('.conflicto')?.textContent?.replace(/\s+/g, ' ') ?? '';
    }

    it('dice con qué finca se cruza y de quién es, sin ofrecer revisión manual', () => {
      llenarYGuardar(tucan.perimetro);

      expect(pagina.querySelector('.aviso')?.textContent).toContain('se sobrepone');
      expect(textoConflicto()).toContain(
        'Tu dibujo se cruza con Finca El Tucán, de Andrés Vargas Quesada.',
      );
      expect(pagina.textContent).not.toContain('revise manualmente');
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
      spyOn(servicio, 'registrar').and.callThrough();
      llenarYGuardar(tucan.perimetro);

      expect(servicio.registrar).toHaveBeenCalledTimes(1);
      let fincas = 0;
      servicio.misFincas(componente['usuario']().id).subscribe((f) => (fincas = f.length));
      expect(fincas).toBe(2);
      expect(pagina.querySelector('.confirmacion')).toBeNull();
    });

    it('al corregir borra solo el polígono y se puede registrar de nuevo', () => {
      componente['formulario'].setValue({
        nombre: 'Finca La Catalina',
        descripcion: 'Café de altura',
        zona: 'Tarrazú',
      });
      componente['duenos'].set([USUARIOS[1]]);
      dibujar(tucan.perimetro);
      const pin = componente['pin']();
      boton('Guardar finca').click();
      fixture.detectChanges();

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
      expect(componente['duenos']()).toEqual([USUARIOS[1]]);
      expect(pagina.querySelector<HTMLInputElement>('#nombre-finca')?.value).toBe(
        'Finca La Catalina',
      );

      componente['perimetro'].set(LIBRE);
      fixture.detectChanges();
      boton('Guardar finca').click();
      fixture.detectChanges();
      expect(pagina.querySelector('.resumen')?.textContent).toContain('Finca La Catalina');
    });
  });

  it('muestra el resumen al guardar y va al dashboard', () => {
    componente['duenos'].set([USUARIOS[1]]);
    llenarYGuardar(LIBRE);

    const resumen = pagina.querySelector('.resumen')!.textContent!;
    expect(resumen).toContain('Finca La Catalina');
    expect(resumen).toContain('Tarrazú');
    expect(resumen).toContain('Rodrigo y María Jiménez');
    expect(pagina.querySelector('.encabezado__texto')).toBeNull();

    const router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    boton('Ir a mi dashboard').click();
    expect(router.navigateByUrl).toHaveBeenCalledWith(RUTA_DASHBOARD);
  });

  it('reinicia el formulario para registrar otra finca', () => {
    llenarYGuardar(LIBRE);
    boton('Registrar otra finca').click();
    fixture.detectChanges();

    expect(componente['perimetro']()).toEqual([]);
    expect(componente['formulario'].controls.nombre.value).toBe('');
    expect(pagina.textContent).toContain('Detalles de tu finca');
  });
});
