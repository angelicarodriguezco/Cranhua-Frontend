import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
  RouterLink,
} from '@angular/router';
import { firstValueFrom, of } from 'rxjs';

import { PedidosService } from '../../core/services/pedidos.service';
import { CLAVE_TEMA, TemaService } from '../../core/services/tema.service';
import { DetalleTostadorComponent } from './detalle-tostador.component';

describe('DetalleTostadorComponent', () => {
  afterEach(() => localStorage.removeItem(CLAVE_TEMA));

  let fixture: ComponentFixture<DetalleTostadorComponent>;
  let elemento: HTMLElement;

  function crear(id: string): void {
    TestBed.configureTestingModule({
      imports: [DetalleTostadorComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id })) } },
      ],
    });
    fixture = TestBed.createComponent(DetalleTostadorComponent);
    elemento = fixture.nativeElement;
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

  it('muestra los datos del tostador y al menos 3 tuestes', () => {
    crear('tostador-volcan');
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
    expect(tuestes.length).toBeGreaterThanOrEqual(3);
    expect(tuestes[0].textContent).toContain('La Catalina · Caturra');
    expect(tuestes[0].textContent).toContain('Tueste claro');
    expect(tuestes[0].textContent).toContain('60 kg');
  });

  it('exige elegir un tueste antes de enviar', () => {
    crear('tostador-volcan');
    const navegar = spyOn(TestBed.inject(Router), 'navigate');
    escribirCantidad('5');
    enviar();

    expect(elemento.querySelector('#ayuda-tueste')?.textContent).toContain('Elegí el tueste');
    expect(navegar).not.toHaveBeenCalled();
  });

  it('elegir un tueste de la lista lo selecciona en el panel', () => {
    crear('tostador-volcan');
    elegirTueste(1);

    expect(
      elemento.querySelector<HTMLSelectElement>('#tueste')!.selectedOptions[0].textContent,
    ).toContain('Monte Alto · Geisha');
    expect(elemento.querySelector('#ayuda-tueste')?.textContent).toContain('25 kg disponibles');
  });

  it('no deja pedir más de lo disponible del tueste elegido', () => {
    crear('tostador-volcan');
    const navegar = spyOn(TestBed.inject(Router), 'navigate');
    elegirTueste(1);
    escribirCantidad('30');

    expect(elemento.querySelector('.error')?.textContent).toContain('Solo hay 25 kg');
    enviar();
    expect(navegar).not.toHaveBeenCalled();

    // Con un tueste con más kg la misma cantidad sí es válida
    elegirTueste(0);
    expect(elemento.querySelector('#ayuda-cantidad.error')).toBeNull();
  });

  it('al enviar un pedido válido lo agrega y navega a Mis pedidos', async () => {
    crear('tostador-volcan');
    const navegar = spyOn(TestBed.inject(Router), 'navigate');
    elegirTueste(0);
    escribirCantidad('12');
    enviar();

    expect(navegar).toHaveBeenCalledWith(['/cafeteria/pedidos']);
    const pedidos = await firstValueFrom(TestBed.inject(PedidosService).listar());
    expect(pedidos[0]).toEqual(
      jasmine.objectContaining({ tostador: 'Tostaduría Volcán', kilos: 12, estado: 'En camino' }),
    );
  });

  it('"Volver" regresa a Explorar tostadores', () => {
    crear('tostador-volcan');
    expect(rutasDe('.volver, .boton-secundario')).toEqual([
      '/cafeteria/tostadores',
      '/cafeteria/tostadores',
    ]);
    expect(elemento.querySelector('.boton-secundario')?.textContent?.trim()).toBe('Volver');
  });

  it('arranca en tema oscuro y alterna a claro en el host', () => {
    crear('tostador-volcan');
    expect(elemento.getAttribute('data-theme')).toBe('oscuro');

    TestBed.inject(TemaService).alternarTema();
    fixture.detectChanges();
    expect(elemento.getAttribute('data-theme')).toBe('claro');
  });

  it('avisa si el tostador no tiene café disponible', () => {
    crear('tostador-brisas-del-sur');
    expect(elemento.textContent).toContain('no tiene café disponible');
  });

  it('avisa si el tostador no existe', () => {
    crear('no-existe');
    expect(elemento.textContent).toContain('No encontramos este tostador.');
  });
});
