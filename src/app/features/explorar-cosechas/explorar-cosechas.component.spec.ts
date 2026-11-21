import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { environment } from '../../../environments/environment';
import {
  COSECHAS_DISPONIBLES_FIXTURE,
  cosechaDisponibleAApi,
} from '../../core/testing/cosechas-disponibles.fixture';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { ExplorarCosechasComponent } from './explorar-cosechas.component';

const BASE = `${environment.apiUrl}/api/cosechas/disponibles`;

describe('ExplorarCosechasComponent', () => {
  let fixture: ComponentFixture<ExplorarCosechasComponent>;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExplorarCosechasComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ExplorarCosechasComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
    http.expectOne(BASE).flush(COSECHAS_DISPONIBLES_FIXTURE.map(cosechaDisponibleAApi));
    fixture.detectChanges();
  });

  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  it('muestra el explorador con al menos 6 cosechas', () => {
    expect(pagina.querySelector('h1')?.textContent?.trim()).toBe('Explorar cosechas');
    expect(pagina.querySelectorAll('.tarjeta').length).toBeGreaterThanOrEqual(6);
  });

  it('"Ver detalle" lleva al detalle de la cosecha', () => {
    const rutas = fixture.debugElement
      .queryAll(By.css('.tarjeta a'))
      .map((el) => el.injector.get(RouterLink).href);
    expect(rutas).toContain('/tostador/cosechas/cosecha-caturra-catalina');
  });

  it('arranca en tema claro y alterna a oscuro', () => {
    const vista = pagina.querySelector('.dashboard')!;
    expect(vista.getAttribute('data-theme')).toBe('claro');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(vista.getAttribute('data-theme')).toBe('oscuro');
  });
});
