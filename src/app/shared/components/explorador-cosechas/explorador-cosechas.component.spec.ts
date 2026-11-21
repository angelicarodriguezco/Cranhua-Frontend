import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { CosechaDisponible, NOTAS_FLORALES } from '../../../core/models/cosecha-disponible.model';
import {
  COSECHAS_DISPONIBLES_FIXTURE,
  cosechaDisponibleAApi,
} from '../../../core/testing/cosechas-disponibles.fixture';
import { ExploradorCosechasComponent } from './explorador-cosechas.component';

const BASE = `${environment.apiUrl}/api/cosechas/disponibles`;

describe('ExploradorCosechasComponent', () => {
  let fixture: ComponentFixture<ExploradorCosechasComponent>;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploradorCosechasComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ExploradorCosechasComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
    responderLista(COSECHAS_DISPONIBLES_FIXTURE);
  });

  afterEach(() => http.verify());

  function responderLista(
    cosechas: CosechaDisponible[],
    predicado?: (url: string) => boolean,
  ): void {
    const peticion = http.expectOne((r) => {
      if (r.url !== BASE || r.method !== 'GET') {
        return false;
      }
      return predicado ? predicado(r.urlWithParams) : true;
    });
    peticion.flush(cosechas.map(cosechaDisponibleAApi));
    fixture.detectChanges();
  }

  function chip(texto: string): HTMLButtonElement {
    const encontrado = [...pagina.querySelectorAll<HTMLButtonElement>('.filtros button')].find(
      (b) => b.textContent?.trim() === texto,
    );
    if (!encontrado) {
      throw new Error(`No hay filtro "${texto}"`);
    }
    return encontrado;
  }

  function clic(elemento: HTMLElement): void {
    elemento.click();
    fixture.detectChanges();
  }

  function fincasVisibles(): string[] {
    return [...pagina.querySelectorAll('.tarjeta h3')].map((h) => h.textContent!.trim());
  }

  function elegirSelect(ariaLabel: string, valor: string): void {
    const select = pagina.querySelector<HTMLSelectElement>(`select[aria-label="${ariaLabel}"]`)!;
    select.value = valor;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('muestra al menos 6 cosechas sin filtros', () => {
    expect(fincasVisibles().length).toBeGreaterThanOrEqual(6);
    expect(chip('Todas').getAttribute('aria-pressed')).toBe('true');
  });

  it('los filtros de servidor recargan y los de cliente filtran en memoria', () => {
    const todas = fincasVisibles().length;
    const honey = COSECHAS_DISPONIBLES_FIXTURE.filter((c) => /honey/i.test(c.proceso));

    clic(chip('Proceso honey'));
    responderLista(honey, (url) => url.includes('honey=true'));
    expect(fincasVisibles()).toEqual([
      'Finca La Catalina',
      'Finca Quebrada Honda',
      'Finca Cerro Verde',
    ]);
    expect(chip('Todas').getAttribute('aria-pressed')).toBe('false');

    clic(chip('Disponible ahora'));
    expect(fincasVisibles()).toHaveSize(3);
    expect(chip('Disponible ahora').getAttribute('aria-pressed')).toBe('true');

    clic(chip('Todas'));
    responderLista(COSECHAS_DISPONIBLES_FIXTURE, (url) => !url.includes('?'));
    expect(fincasVisibles()).toHaveSize(todas);
  });

  it('filtra por notas florales y por zona en el servidor', () => {
    const florales = COSECHAS_DISPONIBLES_FIXTURE.filter((c) =>
      c.notas.some((nota) => NOTAS_FLORALES.includes(nota)),
    );

    clic(chip('Notas florales'));
    responderLista(florales, (url) => url.includes('florales=true'));
    expect(fincasVisibles()).not.toContain('Finca Los Robles');

    clic(chip('Todas'));
    responderLista(COSECHAS_DISPONIBLES_FIXTURE, (url) => !url.includes('?'));

    elegirSelect('Zona', 'Turrialba');
    responderLista(
      COSECHAS_DISPONIBLES_FIXTURE.filter((c) => c.zona === 'Turrialba'),
      (url) => url.includes('zona=Turrialba'),
    );
    expect(fincasVisibles()).toEqual(['Finca Los Robles']);
  });

  it('filtra por variedad y por precio en cliente', () => {
    elegirSelect('Variedad', 'Geisha');
    expect(fincasVisibles()).toEqual(['Finca Monte Alto']);

    clic(chip('Todas'));
    elegirSelect('Precio', 'alto');
    expect(fincasVisibles()).toEqual(['Finca Monte Alto', 'Finca Cerro Verde']);
  });

  it('avisa si ninguna cosecha cumple los filtros', () => {
    elegirSelect('Zona', 'Orosi');
    responderLista(
      COSECHAS_DISPONIBLES_FIXTURE.filter((c) => c.zona === 'Orosi'),
      (url) => url.includes('zona=Orosi'),
    );
    elegirSelect('Precio', 'alto');
    expect(fincasVisibles()).toEqual([]);
    expect(pagina.textContent).toContain('Ninguna cosecha coincide con los filtros.');
  });

  it('muestra carga y error del API', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(ExploradorCosechasComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
    expect(pagina.textContent).toContain('Cargando cosechas…');

    const peticion = http.expectOne(BASE);
    peticion.flush(
      { mensaje: 'Zona cafetalera no válida' },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();
    expect(pagina.textContent).toContain('Zona cafetalera no válida');
  });

  it('muestra vacío sin filtros cuando el API no trae cosechas', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(ExploradorCosechasComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
    http.expectOne(BASE).flush([]);
    fixture.detectChanges();
    expect(pagina.textContent).toContain('No hay cosechas disponibles por ahora.');
  });
});
