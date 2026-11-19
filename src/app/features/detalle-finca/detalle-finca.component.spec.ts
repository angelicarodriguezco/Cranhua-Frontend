import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { FINCAS_REGISTRADAS, USUARIOS } from '../../core/mocks/finca.mock';
import { Cosecha } from '../../core/models/cosecha.model';
import { CosechaService } from '../../core/services/cosecha.service';
import { FincaService } from '../../core/services/finca.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { cosechaDePrueba } from '../../core/testing/cosechas-de-prueba';
import { AVISO_ELIMINAR_FINCA, DetalleFincaComponent } from './detalle-finca.component';
import { conSesionDeEjemplo } from '../../core/testing/sesion-de-ejemplo';

const SIN_CUENTA = 'No encontramos una cuenta de cafetalero con ese correo.';
const YA_ES_DUENO = 'Esa cuenta ya es dueña de esta finca.';

// Responde como el backend (404 si el correo no existe, 409 si ya es dueño)
const fincaServiceFalso = {
  obtener: (id: string) => {
    const finca = FINCAS_REGISTRADAS.find((f) => f.id === id);
    return finca ? of(finca) : throwError(() => new Error('404'));
  },
  agregarDueno: (id: string, correo: string) => {
    const finca = FINCAS_REGISTRADAS.find((f) => f.id === id)!;
    const usuario = USUARIOS.find((u) => u.correo === correo);
    if (!usuario) {
      return of({ agregado: false, mensaje: SIN_CUENTA });
    }
    if (finca.duenosAdicionales.some((d) => d.id === usuario.id)) {
      return of({ agregado: false, mensaje: YA_ES_DUENO });
    }
    return of({
      agregado: true,
      finca: { ...finca, duenosAdicionales: [...finca.duenosAdicionales, usuario] },
    });
  },
  eliminar: () => of(true),
};

const COSECHAS_ESPERANZA: Cosecha[] = [
  cosechaDePrueba({
    id: 'c-le-caturra',
    fincaId: 'f-la-esperanza',
    variedad: 'Caturra',
    codigoLote: 'LE-2026-001',
    precioKg: 4200,
    kgDisponibles: 96,
  }),
  cosechaDePrueba({
    id: 'c-le-catuai',
    fincaId: 'f-la-esperanza',
    variedad: 'Catuaí',
    codigoLote: 'LE-2026-002',
    precioKg: 3800,
    estado: 'EN_BENEFICIADO',
    pesoTrasSeleccionKg: null,
    kgDisponibles: null,
  }),
];

const cosechaServiceFalso = {
  deFinca: (id: string) => of(id === 'f-la-esperanza' ? COSECHAS_ESPERANZA : []),
};

describe('DetalleFincaComponent', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'cafetalero/fincas/:id', component: DetalleFincaComponent }]),
        // Sin cargar Google Maps
        { provide: GoogleMapsService, useValue: { apiCargada: of(false) } },
        { provide: FincaService, useValue: fincaServiceFalso },
        { provide: CosechaService, useValue: cosechaServiceFalso },
      ],
    });
    conSesionDeEjemplo();
    harness = await RouterTestingHarness.create();
  });

  async function abrir(id: string, query = ''): Promise<HTMLElement> {
    await harness.navigateByUrl(`/cafetalero/fincas/${id}${query}`, DetalleFincaComponent);
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

    expect(textos(pagina, 'app-lista-duenos .nombre')).toEqual([
      'Rodrigo Solís Ureña',
      'María Jiménez Solano',
    ]);
    expect(textos(pagina, 'app-tabla-cosechas .lote')).toEqual(['LE-2026-001', 'LE-2026-002']);
  });

  it('muestra el precio por kg y los kg disponibles de cada cosecha', async () => {
    const pagina = await abrir('f-la-esperanza');

    expect(textos(pagina, 'app-tabla-cosechas .precio').map((t) => t.replace(/\s/g, ' '))).toEqual([
      '₡4 200',
      '₡3 800',
    ]);
    const filas = [...pagina.querySelectorAll('app-tabla-cosechas tbody tr')];
    expect(filas[0].textContent).toContain('96 kg');
    expect(filas[1].querySelectorAll('td')[4].textContent?.trim()).toBe('—');
    expect(filas[1].textContent).toContain('En beneficiado');
  });

  it('resalta la cosecha que viene en ?cosecha=', async () => {
    spyOn(Element.prototype, 'scrollIntoView');
    const pagina = await abrir('f-la-esperanza', '?cosecha=c-le-catuai');

    const resaltadas = pagina.querySelectorAll('app-tabla-cosechas tr.fila-resaltada');
    expect(resaltadas.length).toBe(1);
    expect(resaltadas[0].textContent).toContain('Catuaí');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('marca con "Vos" al usuario actual y no muestra "Propietario"', async () => {
    const pagina = await abrir('f-la-esperanza');

    expect(textos(pagina, 'app-lista-duenos .etiqueta')).toEqual(['Vos']);
    expect(pagina.querySelector('app-lista-duenos')?.textContent).not.toContain('Propietario');
  });

  it('el mapa usa las hectáreas de la API', async () => {
    const finca = FINCAS_REGISTRADAS.find((f) => f.id === 'f-la-esperanza')!;
    spyOn(TestBed.inject(FincaService), 'obtener').and.returnValue(
      of({ ...finca, areaHectareas: 121.3 }),
    );

    const pagina = await abrir('f-la-esperanza');

    expect(pagina.querySelector('app-mapa-perimetro .area')?.textContent).toContain(
      '121.3 hectáreas',
    );
  });

  it('agrega un dueño por correo y actualiza el indicador', async () => {
    const pagina = await abrir('f-la-esperanza');

    agregarDueno(pagina, 'andres.vargas@ejemplo.cr');

    expect(pagina.querySelectorAll('app-lista-duenos li').length).toBe(3);
    expect(textos(pagina, '.indicadores strong')[3]).toBe('3');
  });

  it('muestra el mensaje del backend si el correo no tiene cuenta', async () => {
    const pagina = await abrir('f-la-esperanza');

    agregarDueno(pagina, 'nadie@ejemplo.cr');

    expect(pagina.querySelector('app-lista-duenos .error')?.textContent).toContain(SIN_CUENTA);
    expect(pagina.querySelectorAll('app-lista-duenos li').length).toBe(2);
  });

  it('muestra el mensaje del backend si la cuenta ya es dueña', async () => {
    const pagina = await abrir('f-la-esperanza');
    const maria = USUARIOS.find((u) => u.id === 'u-maria')!;

    agregarDueno(pagina, maria.correo);

    expect(pagina.querySelector('app-lista-duenos .error')?.textContent).toContain(YA_ES_DUENO);
    expect(pagina.querySelectorAll('app-lista-duenos li').length).toBe(2);
  });

  it('"Editar" lleva a la edición de la finca, su perímetro y cada cosecha', async () => {
    await abrir('f-la-esperanza');

    const rutas = harness.fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .filter((el) => el.nativeElement.textContent.includes('Editar'))
      .map((el) => el.injector.get(RouterLink).href);
    expect(rutas).toEqual([
      '/cafetalero/fincas/f-la-esperanza/editar',
      '/cafetalero/fincas/f-la-esperanza/editar',
      '/cafetalero/cosechas/c-le-caturra/editar',
      '/cafetalero/cosechas/c-le-catuai/editar',
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
      'rgb(255, 255, 255)',
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
