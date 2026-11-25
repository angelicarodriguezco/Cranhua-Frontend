import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
  RouterLink,
} from '@angular/router';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CAFETERIA_EJEMPLO } from '../../core/mocks/cafeteria.mock';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { detalleTostadorApi, pedidoApi } from '../../core/testing/pedidos-cafeteria.fixture';
import { DetalleTostadorComponent } from './detalle-tostador.component';

const URL_DETALLE = `${environment.apiUrl}/api/tostadores/t-volcan`;
const URL_PEDIDOS = `${environment.apiUrl}/api/pedidos`;

describe('DetalleTostadorComponent', () => {
  let fixture: ComponentFixture<DetalleTostadorComponent>;
  let elemento: HTMLElement;
  let http: HttpTestingController;

  afterEach(() => {
    localStorage.removeItem(CLAVE_TEMA);
    http.verify();
  });

  function crear(id = 't-volcan'): void {
    TestBed.configureTestingModule({
      imports: [DetalleTostadorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id })),
            snapshot: { paramMap: convertToParamMap({ id }) },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(CafeteriaService), 'obtenerActual').and.returnValue(of(CAFETERIA_EJEMPLO));
    fixture = TestBed.createComponent(DetalleTostadorComponent);
    elemento = fixture.nativeElement;
    fixture.detectChanges();
  }

  function crearConDetalle(cuerpo = detalleTostadorApi()): void {
    crear();
    http.expectOne(URL_DETALLE).flush(cuerpo);
    fixture.detectChanges();
  }

  function elegirTueste(indice: number): void {
    elemento.querySelectorAll<HTMLButtonElement>('.tueste .chip')[indice].click();
    fixture.detectChanges();
  }

  function escribirCantidad(valor: string): void {
    const input = elemento.querySelector<HTMLInputElement>('#cantidad')!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function enviar(): void {
    elemento.querySelector<HTMLButtonElement>('.boton-principal')!.click();
    fixture.detectChanges();
  }

  function rutasDe(selector: string): string[] {
    return fixture.debugElement
      .queryAll(By.css(selector))
      .map((el) => el.injector.get(RouterLink).href ?? '');
  }

  it('muestra un estado de carga y luego los datos del tostador con sus tuestes', () => {
    crear();
    expect(elemento.querySelector('[role="status"]')?.textContent).toContain('Cargando tostador');

    http.expectOne(URL_DETALLE).flush(detalleTostadorApi());
    fixture.detectChanges();

    const texto = elemento.textContent ?? '';
    expect(elemento.querySelector('h1')?.textContent?.trim()).toBe('Tostaduría Volcán');
    expect(texto).toContain('San José, San José');
    expect(texto).toContain('Laura Mora');
    expect(texto).toContain('laura@tostaduriavolcan.cr');
    expect([...elemento.querySelectorAll('.estilos li')].map((li) => li.textContent)).toEqual([
      'Claro',
      'Medio',
    ]);

    const tuestes = elemento.querySelectorAll('.tueste');
    expect(tuestes).toHaveSize(3);
    expect(tuestes[0].textContent).toContain('La Catalina · Caturra');
    expect(tuestes[0].textContent).toContain('Tueste claro');
    expect(tuestes[0].textContent).toContain('60 kg');
  });

  it('exige elegir un tueste antes de enviar', () => {
    crearConDetalle();
    escribirCantidad('5');
    enviar();

    expect(elemento.querySelector('#ayuda-tueste')?.textContent).toContain('Elegí el tueste');
    http.expectNone(URL_PEDIDOS);
  });

  it('elegir un tueste de la lista lo selecciona en el panel', () => {
    crearConDetalle();
    elegirTueste(1);

    expect(
      elemento.querySelector<HTMLSelectElement>('#tueste')!.selectedOptions[0].textContent,
    ).toContain('Monte Alto · Geisha');
    expect(elemento.querySelector('#ayuda-tueste')?.textContent).toContain('25 kg disponibles');
  });

  it('no deja pedir más de lo disponible del tueste elegido', () => {
    crearConDetalle();
    elegirTueste(1);
    escribirCantidad('30');

    expect(elemento.querySelector('.error')?.textContent).toContain('Solo hay 25 kg');
    enviar();
    http.expectNone(URL_PEDIDOS);

    elegirTueste(0);
    expect(elemento.querySelector('#ayuda-cantidad.error')).toBeNull();
  });

  it('al enviar un pedido válido lo crea en el backend y navega a Mis pedidos', () => {
    crearConDetalle();
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    elegirTueste(0);
    escribirCantidad('12');
    enviar();

    const req = http.expectOne(URL_PEDIDOS);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ tuesteId: 'tu-1', cantidadKg: 12 });
    expect(elemento.querySelector('.boton-principal')?.textContent).toContain('Enviando');
    req.flush(pedidoApi());

    expect(navegar).toHaveBeenCalledWith(['/cafeteria/pedidos']);
  });

  it('muestra en el formulario el error del backend y lo limpia al cambiar la cantidad', () => {
    crearConDetalle();
    const navegar = spyOn(TestBed.inject(Router), 'navigate');
    elegirTueste(0);
    escribirCantidad('50');
    enviar();

    // Otra cafetería pidió de este tueste después de que se cargó la vista
    http
      .expectOne(URL_PEDIDOS)
      .flush(
        { mensaje: 'No hay suficiente café disponible: pedís 50 kg y quedan 40 kg.' },
        { status: 400, statusText: 'Bad Request' },
      );
    fixture.detectChanges();

    expect(elemento.querySelector('.pedido [role="alert"]')?.textContent).toContain(
      'No hay suficiente café disponible: pedís 50 kg y quedan 40 kg.',
    );
    expect(navegar).not.toHaveBeenCalled();

    escribirCantidad('40');
    expect(elemento.querySelector('.pedido [role="alert"]')).toBeNull();
  });

  it('"Volver" regresa a Explorar tostadores', () => {
    crearConDetalle();
    expect(rutasDe('.volver, .boton-secundario')).toEqual([
      '/cafeteria/tostadores',
      '/cafeteria/tostadores',
    ]);
    expect(elemento.querySelector('.boton-secundario')?.textContent?.trim()).toBe('Volver');
  });

  it('arranca en tema claro y alterna a oscuro en el host', () => {
    crearConDetalle();
    expect(elemento.getAttribute('data-theme')).toBe('claro');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(elemento.getAttribute('data-theme')).toBe('oscuro');
  });

  it('avisa si el tostador no tiene café disponible', () => {
    crearConDetalle(detalleTostadorApi({ tuestes: [] }));
    expect(elemento.textContent).toContain('no tiene café disponible');
  });

  it('avisa si el tostador no existe', () => {
    crear();
    http
      .expectOne(URL_DETALLE)
      .flush({ mensaje: 'No encontramos ese negocio.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(elemento.textContent).toContain('No encontramos este tostador.');
  });

  it('muestra el error de carga y permite reintentar', () => {
    crear();
    http.expectOne(URL_DETALLE).flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(elemento.querySelector('[role="alert"]')).toBeTruthy();

    elemento.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    http.expectOne(URL_DETALLE).flush(detalleTostadorApi());
    fixture.detectChanges();
    expect(elemento.querySelector('h1')?.textContent?.trim()).toBe('Tostaduría Volcán');
  });
});
