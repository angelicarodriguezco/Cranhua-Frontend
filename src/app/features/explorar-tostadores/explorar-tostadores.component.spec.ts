import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CAFETERIA_EJEMPLO } from '../../core/mocks/cafeteria.mock';
import { TostadorExploracionApi } from '../../core/models/tostador-disponible.model';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { TOSTADORES_API } from '../../core/testing/pedidos-cafeteria.fixture';
import { ExplorarTostadoresComponent } from './explorar-tostadores.component';

const BASE = `${environment.apiUrl}/api/tostadores`;

describe('ExplorarTostadoresComponent', () => {
  let fixture: ComponentFixture<ExplorarTostadoresComponent>;
  let pagina: HTMLElement;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ExplorarTostadoresComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    // El menú lateral consulta la cafetería de la cuenta
    spyOn(TestBed.inject(CafeteriaService), 'obtenerActual').and.returnValue(of(CAFETERIA_EJEMPLO));
    fixture = TestBed.createComponent(ExplorarTostadoresComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(CLAVE_TEMA);
    http.verify();
  });

  function responder(cuerpo: TostadorExploracionApi[] = TOSTADORES_API): void {
    http.expectOne((r) => r.url === BASE).flush(cuerpo);
    fixture.detectChanges();
  }

  function chip(texto: string): HTMLButtonElement {
    return [...pagina.querySelectorAll<HTMLButtonElement>('.chip')].find(
      (b) => b.textContent!.trim() === texto,
    )!;
  }

  it('muestra un estado de carga mientras consulta', () => {
    expect(pagina.querySelector('[role="status"]')?.textContent).toContain('Cargando tostadores');
    responder();
    expect(pagina.querySelector('[role="status"]')).toBeNull();
  });

  it('muestra las tarjetas con los datos del backend y enlaza al detalle', () => {
    responder();
    const tarjetas = pagina.querySelectorAll('.tarjeta');
    expect(tarjetas).toHaveSize(2);
    expect(tarjetas[0].textContent).toContain('Tostaduría Volcán');
    expect(tarjetas[0].textContent).toContain('San José, San José');
    expect(tarjetas[0].textContent).toContain('Claro · Medio');
    expect(tarjetas[0].textContent).toContain('85 kg');

    const enlace = fixture.debugElement.query(By.css('.tarjeta a')).injector.get(RouterLink);
    expect(enlace.href).toBe('/cafeteria/tostadores/t-volcan');
  });

  it('cada filtro vuelve a consultar al backend', () => {
    responder();

    chip('Oscuro').click();
    fixture.detectChanges();
    const porEstilo = http.expectOne((r) => r.url === BASE);
    expect(porEstilo.request.params.get('estilo')).toBe('OSCURO');
    porEstilo.flush([TOSTADORES_API[1]]);

    chip('Con café disponible').click();
    fixture.detectChanges();
    const conCafe = http.expectOne((r) => r.url === BASE);
    expect(conCafe.request.params.get('estilo')).toBe('OSCURO');
    expect(conCafe.request.params.get('disponible')).toBe('true');
    conCafe.flush([]);
    fixture.detectChanges();

    expect(pagina.querySelector('.vacio')?.textContent).toContain('Ningún tostador coincide');

    chip('Todos').click();
    fixture.detectChanges();
    const todos = http.expectOne((r) => r.url === BASE);
    expect(todos.request.params.keys()).toEqual([]);
    todos.flush([]);
    fixture.detectChanges();
    expect(pagina.querySelector('.vacio')?.textContent).toContain('Todavía no hay tostadores');
  });

  it('muestra el error y permite reintentar', () => {
    http
      .expectOne((r) => r.url === BASE)
      .flush({ mensaje: 'Algo salió mal.' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(pagina.querySelector('[role="alert"]')?.textContent).toContain('Algo salió mal.');

    chip('Reintentar').click();
    fixture.detectChanges();
    responder();
    expect(pagina.querySelectorAll('.tarjeta')).toHaveSize(2);
  });

  it('sigue el tema del panel de cafetería', () => {
    responder();
    expect(pagina.getAttribute('data-theme')).toBe('claro');
    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
  });
});
