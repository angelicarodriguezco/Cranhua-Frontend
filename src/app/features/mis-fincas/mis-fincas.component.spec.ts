import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FincaResponseApi } from '../../core/models/finca.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { MisFincasComponent, RUTA_REGISTRAR_FINCA } from './mis-fincas.component';

const BASE = `${environment.apiUrl}/api/fincas`;

function fincaApi(id: string, nombre: string): FincaResponseApi {
  return {
    id,
    nombre,
    descripcion: null,
    zonaCafetalera: 'Tarrazú',
    perimetro: [
      { lat: 9.65, lng: -84.03 },
      { lat: 9.65, lng: -84.02 },
      { lat: 9.66, lng: -84.02 },
    ],
    ubicacion: { lat: 9.655, lng: -84.025 },
    canton: 'Tarrazú',
    provincia: 'San José',
    areaHectareas: 12.5,
    duenos: [{ id: 'u-rodrigo', nombreCompleto: 'Rodrigo Solís Ureña' }],
  };
}

describe('MisFincasComponent', () => {
  let fixture: ComponentFixture<MisFincasComponent>;
  let elemento: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisFincasComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CafeteriaService, useValue: { obtenerActual: () => of(undefined) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MisFincasComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    elemento = fixture.nativeElement;
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(CLAVE_TEMA);
  });

  function responder(fincas: FincaResponseApi[]) {
    http.expectOne(BASE).flush(fincas);
    fixture.detectChanges();
  }

  it('muestra el menú lateral y el encabezado del prototipo', () => {
    responder([]);
    expect(elemento.querySelector('app-menu-lateral')).toBeTruthy();
    expect(elemento.querySelector('h1')?.textContent).toContain('Mis fincas');
    expect(elemento.textContent).toContain(
      'Estas son las fincas que tenés registradas en Cránhua.',
    );
  });

  it('muestra "Cargando tus fincas…" mientras responde el backend', () => {
    const req = http.expectOne(BASE);
    expect(req.request.withCredentials).toBeTrue();
    expect(elemento.textContent).toContain('Cargando tus fincas…');
    expect(elemento.querySelector('app-tarjeta-finca')).toBeNull();
    req.flush([]);
  });

  it('muestra una tarjeta por finca, enlazada a su detalle', () => {
    responder([fincaApi('f-1', 'Finca La Esperanza'), fincaApi('f-2', 'Finca El Mirador')]);

    expect(elemento.querySelectorAll('app-tarjeta-finca').length).toBe(2);
    const enlaces = Array.from(
      elemento.querySelectorAll<HTMLAnchorElement>('app-tarjeta-finca a.tarjeta__accion'),
    ).map((a) => a.getAttribute('href'));
    expect(enlaces).toEqual(['/cafetalero/fincas/f-1', '/cafetalero/fincas/f-2']);
    expect(elemento.querySelector('a.nueva-finca')?.getAttribute('href')).toBe(
      RUTA_REGISTRAR_FINCA,
    );
  });

  it('sin fincas muestra el estado vacío con el botón de registrar', () => {
    responder([]);

    expect(elemento.textContent).toContain('Todavía no registraste fincas');
    expect(elemento.querySelector('.estado a.cta')?.getAttribute('href')).toBe(
      RUTA_REGISTRAR_FINCA,
    );
    expect(elemento.querySelector('app-tarjeta-finca')).toBeNull();
  });

  it('si falla muestra el error y "Reintentar" vuelve a pedir las fincas', () => {
    http.expectOne(BASE).error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(elemento.textContent).toContain('No pudimos cargar tus fincas.');

    elemento.querySelector<HTMLButtonElement>('.estado button')!.click();
    fixture.detectChanges();
    expect(elemento.textContent).toContain('Cargando tus fincas…');

    responder([fincaApi('f-1', 'Finca La Esperanza')]);
    expect(elemento.textContent).not.toContain('No pudimos cargar tus fincas.');
    expect(elemento.querySelectorAll('app-tarjeta-finca').length).toBe(1);
  });

  it('tiene el botón para registrar una nueva finca en la cabecera', () => {
    responder([]);
    const cta = elemento.querySelector<HTMLAnchorElement>('.cabecera .cta');
    expect(cta?.getAttribute('href')).toBe(RUTA_REGISTRAR_FINCA);
    expect(cta?.textContent).toContain('Registrar finca');
  });

  it('permite alternar entre tema oscuro y claro', () => {
    responder([]);
    const root = elemento.querySelector('.mis-fincas')!;
    expect(root.getAttribute('data-theme')).toBe('oscuro');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(root.getAttribute('data-theme')).toBe('claro');
  });
});
