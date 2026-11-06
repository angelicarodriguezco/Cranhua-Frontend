import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { FincaService } from '../../core/services/finca.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { AVISO_ELIMINAR_FINCA, DetalleFincaComponent } from './detalle-finca.component';

describe('DetalleFincaComponent', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'cafetalero/fincas/:id', component: DetalleFincaComponent }]),
        // Sin cargar Google Maps
        { provide: GoogleMapsService, useValue: { apiCargada: of(false) } },
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  async function abrir(id: string): Promise<HTMLElement> {
    await harness.navigateByUrl(`/cafetalero/fincas/${id}`, DetalleFincaComponent);
    harness.detectChanges();
    return harness.routeNativeElement!;
  }

  function textos(pagina: HTMLElement, selector: string): string[] {
    return [...pagina.querySelectorAll(selector)].map((e) => e.textContent?.trim() ?? '');
  }

  function agregarDueno(pagina: HTMLElement, correo: string): void {
    const campo = pagina.querySelector<HTMLInputElement>('app-lista-duenos input')!;
    campo.value = correo;
    campo.dispatchEvent(new Event('input'));
    pagina.querySelector('app-lista-duenos form')!.dispatchEvent(new Event('submit'));
    harness.detectChanges();
  }

  it('muestra el nombre, la ubicación y los indicadores de la finca', async () => {
    const pagina = await abrir('f-la-esperanza');

    expect(pagina.querySelector('h1')?.textContent).toContain('Finca La Esperanza');
    expect(pagina.querySelector('.cabecera p')?.textContent).toContain('León Cortés, San José');
    expect(textos(pagina, '.indicadores strong').slice(1)).toEqual(['2', '96 kg', '2']);
  });

  it('lista los dueños y las cosechas con su código de lote', async () => {
    const pagina = await abrir('f-la-esperanza');

    expect(pagina.querySelectorAll('app-lista-duenos li').length).toBe(2);
    expect(textos(pagina, 'app-tabla-cosechas .lote')).toEqual(['LE-2026-001', 'LE-2026-002']);
  });

  it('agrega un dueño por correo y actualiza el indicador', async () => {
    const pagina = await abrir('f-la-esperanza');

    agregarDueno(pagina, 'andres.vargas@ejemplo.cr');

    expect(pagina.querySelectorAll('app-lista-duenos li').length).toBe(3);
    expect(textos(pagina, '.indicadores strong')[3]).toBe('3');
  });

  it('muestra el error si el correo no tiene cuenta', async () => {
    const pagina = await abrir('f-la-esperanza');

    agregarDueno(pagina, 'nadie@ejemplo.cr');

    expect(pagina.querySelector('app-lista-duenos .error')?.textContent).toContain(
      'No hay ninguna cuenta',
    );
    expect(pagina.querySelectorAll('app-lista-duenos li').length).toBe(2);
  });

  it('"Editar finca" y "Editar perímetro" llevan al formulario de edición', async () => {
    await abrir('f-la-esperanza');

    const rutas = harness.fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .filter((el) => el.nativeElement.textContent.includes('Editar'))
      .map((el) => el.injector.get(RouterLink).href);
    expect(rutas).toEqual([
      '/cafetalero/fincas/f-la-esperanza/editar',
      '/cafetalero/fincas/f-la-esperanza/editar',
    ]);
  });

  it('muestra la zona de peligro con "Eliminar finca"', async () => {
    const pagina = await abrir('f-la-esperanza');
    expect(pagina.querySelector('app-zona-peligro button')?.textContent).toContain(
      'Eliminar finca',
    );
  });

  it('"Eliminar finca" abre el modal; cancelar lo cierra y confirmar elimina y vuelve a Mis fincas', async () => {
    const pagina = await abrir('f-la-esperanza');
    const fincaService = TestBed.inject(FincaService);
    const eliminar = spyOn(fincaService, 'eliminar').and.callThrough();
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    pagina.querySelector<HTMLButtonElement>('app-zona-peligro button')!.click();
    harness.detectChanges();
    expect(pagina.querySelector('.modal__titulo')?.textContent).toBe(
      '¿Eliminar Finca La Esperanza?',
    );
    expect(pagina.querySelector('.modal__aviso')?.textContent).toContain(AVISO_ELIMINAR_FINCA);
    expect(getComputedStyle(pagina.querySelector('.modal__dialogo')!).backgroundColor).toBe(
      'rgba(8, 28, 38, 0.96)',
    );

    pagina.querySelector<HTMLButtonElement>('.modal__btn--secundario')!.click();
    harness.detectChanges();
    expect(pagina.querySelector('app-modal-confirmacion')).toBeNull();
    expect(eliminar).not.toHaveBeenCalled();

    pagina.querySelector<HTMLButtonElement>('app-zona-peligro button')!.click();
    harness.detectChanges();
    pagina.querySelector<HTMLButtonElement>('.modal__btn--peligro')!.click();
    harness.detectChanges();

    expect(eliminar).toHaveBeenCalledWith('f-la-esperanza');
    expect(navegar).toHaveBeenCalledWith('/cafetalero/fincas');
  });

  it('avisa cuando la finca no existe', async () => {
    const pagina = await abrir('f-no-existe');
    expect(pagina.querySelector('h1')?.textContent).toContain('No encontramos esta finca');
    expect(pagina.querySelector('app-zona-peligro')).toBeNull();
  });
});
