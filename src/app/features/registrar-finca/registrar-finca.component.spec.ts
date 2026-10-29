import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';

import { GoogleMapsService } from '../../core/services/google-maps.service';
import { FINCAS_REGISTRADAS, USUARIOS } from '../../core/mocks/finca.mock';
import { Coordenada } from '../../core/models/finca.model';
import { RUTA_DASHBOARD } from '../onboarding-finca/onboarding-finca.component';
import { RegistrarFincaComponent } from './registrar-finca.component';

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

  it('cambia entre tema oscuro y claro desde el menú', () => {
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
    pagina.querySelector<HTMLButtonElement>('.toggle-tema')!.click();
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

  it('avisa de la superposición y permite corregir el dibujo', () => {
    llenarYGuardar(FINCAS_REGISTRADAS[0].perimetro);

    expect(pagina.querySelector('.aviso')?.textContent).toContain('se sobrepone');
    expect(pagina.querySelector('.conflicto')?.textContent).toContain('Finca El Tucán');

    boton('Corregir el dibujo').click();
    fixture.detectChanges();
    expect(pagina.querySelector('.conflicto')).toBeNull();
    expect(componente['perimetro']()).toEqual(FINCAS_REGISTRADAS[0].perimetro);
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
