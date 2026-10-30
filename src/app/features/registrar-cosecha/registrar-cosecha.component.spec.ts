import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { convertToParamMap, provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { CosechaService } from '../../core/services/cosecha.service';
import { PasoDatosCosechaComponent } from './components/paso-datos-cosecha/paso-datos-cosecha.component';
import { PasoSeleccionCatacionComponent } from './components/paso-seleccion-catacion/paso-seleccion-catacion.component';
import { RegistrarCosechaComponent } from './registrar-cosecha.component';

describe('RegistrarCosechaComponent', () => {
  let fixture: ComponentFixture<RegistrarCosechaComponent>;
  let pagina: HTMLElement;

  async function crearComponente(id: string | null = null): Promise<void> {
    TestBed.resetTestingModule();
    const paramMap = convertToParamMap(id ? { id } : {});

    await TestBed.configureTestingModule({
      imports: [RegistrarCosechaComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(paramMap),
            snapshot: { paramMap },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarCosechaComponent);
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  }

  function completarPaso1(): void {
    const paso1 = fixture.debugElement.query(By.directive(PasoDatosCosechaComponent))
      .componentInstance as PasoDatosCosechaComponent;

    paso1['formulario'].patchValue({
      fincaId: 'finca-la-catalina',
      variedad: 'Caturra',
      alturaMsnm: 1650,
      cantidadTotalKg: 120,
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-10',
    });
    paso1['formulario'].controls.procesos.at(0).patchValue({
      proceso: 'Honey',
      porcentaje: 100,
    });
    fixture.detectChanges();
    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
  }

  it('muestra el menú del cafetalero y el título de registro', async () => {
    await crearComponente();

    expect(pagina.querySelector('nav')?.textContent).toContain('Registrar cosecha');
    expect(pagina.querySelector('.perfil-nombre')?.textContent).toBe('Rodrigo Alvarado');
    expect(pagina.querySelector('.encabezado__titulo')?.textContent).toBe('Registrar cosecha');
    expect(pagina.querySelector('.encabezado__texto')?.textContent).toContain(
      'Paso 1 de 2 — Datos de la cosecha y reparto por proceso.',
    );
  });

  it('cambia el título en modo edición y mantiene el subtítulo de paso', async () => {
    await crearComponente('cosecha-1');

    expect(pagina.querySelector('.encabezado__titulo')?.textContent).toBe('Editar cosecha');
    expect(pagina.querySelector('.encabezado__texto')?.textContent).toContain(
      'Paso 1 de 2 — Datos de la cosecha y reparto por proceso.',
    );
    expect(fixture.componentInstance['modoEdicion']()).toBe(true);
    expect(fixture.componentInstance['cosechaId']()).toBe('cosecha-1');
  });

  it('actualiza el subtítulo al avanzar al paso 2', async () => {
    await crearComponente();
    completarPaso1();

    expect(fixture.componentInstance['paso']()).toBe('seleccion');
    expect(pagina.querySelector('.encabezado__texto')?.textContent).toContain(
      'Paso 2 de 2 — Selección final, catación y caracolillo.',
    );
    expect(pagina.querySelectorAll('.tarjeta').length).toBe(2);
    expect(pagina.textContent).toContain('Guardar cosecha');
    expect(pagina.textContent).toContain('Merma calculada por selección');
  });

  it('oculta el encabezado en la pantalla de éxito', async () => {
    await crearComponente();
    completarPaso1();

    const paso2 = fixture.debugElement.query(By.directive(PasoSeleccionCatacionComponent))
      .componentInstance as PasoSeleccionCatacionComponent;
    paso2['formulario'].patchValue({
      pesoAntesKg: 120,
      pesoTrasSeleccionKg: 96,
    });
    fixture.detectChanges();
    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance['paso']()).toBe('exito');
    expect(pagina.querySelector('.encabezado')).toBeNull();
    expect(pagina.querySelector('.encabezado__titulo')).toBeNull();
  });

  it('aplica tokens Figma en tema oscuro y claro', async () => {
    await crearComponente();

    expect(pagina.getAttribute('data-theme')).toBe('oscuro');
    let estilos = getComputedStyle(pagina);
    expect(estilos.getPropertyValue('--vidrio-fondo').trim()).toBe('rgba(8, 28, 38, 0.55)');
    expect(estilos.getPropertyValue('--vidrio-texto').trim()).toBe('#f5efe3');
    expect(estilos.getPropertyValue('--vidrio-texto-suave').trim()).toBe('#aec0bc');
    expect(estilos.getPropertyValue('--vidrio-dorado').trim()).toBe('#a57008');
    expect(estilos.getPropertyValue('--vidrio-dorado-claro').trim()).toBe('#d9a441');
    expect(estilos.getPropertyValue('--vidrio-exito').trim()).toBe('#7fda9f');
    expect(estilos.getPropertyValue('--vidrio-merma-texto').trim()).toBe('#e3b65b');

    pagina.querySelector<HTMLButtonElement>('.toggle-tema')!.click();
    fixture.detectChanges();

    expect(pagina.getAttribute('data-theme')).toBe('claro');
    estilos = getComputedStyle(pagina);
    expect(estilos.getPropertyValue('--vidrio-fondo').trim()).toBe('rgba(255, 255, 255, 0.6)');
    expect(estilos.getPropertyValue('--vidrio-dorado').trim()).toBe('#a57008');
    expect(estilos.getPropertyValue('--vidrio-exito').trim()).toBe('#2f6b45');
    expect(estilos.getPropertyValue('--vidrio-texto').trim()).toBe('#1c3426');
    expect(estilos.getPropertyValue('--vidrio-merma-texto').trim()).toBe('#8a5a06');
  });

  it('renderiza el paso 1 con campos de datos y reparto', async () => {
    await crearComponente();

    expect(pagina.querySelector('app-paso-datos-cosecha')).toBeTruthy();
    expect(pagina.querySelectorAll('.tarjeta').length).toBe(2);
    expect(pagina.querySelector('#cosecha-finca')).toBeTruthy();
    expect(pagina.querySelector('#cosecha-cantidad')).toBeTruthy();
    expect(pagina.querySelector('#proceso-0')).toBeTruthy();
    expect(pagina.querySelector('.reparto__punto')).toBeTruthy();
    expect(pagina.textContent).toContain('Continuar →');
    expect(pagina.textContent).toContain('% asignado');
  });

  it('no avanza de paso si los porcentajes no suman 100', async () => {
    await crearComponente();

    const paso1 = fixture.debugElement.query(By.directive(PasoDatosCosechaComponent))
      .componentInstance as PasoDatosCosechaComponent;

    paso1['formulario'].patchValue({
      fincaId: 'finca-la-catalina',
      variedad: 'Caturra',
      alturaMsnm: 1650,
      cantidadTotalKg: 120,
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-10',
    });
    paso1['formulario'].controls.procesos.at(0).patchValue({
      proceso: 'Honey',
      porcentaje: 40,
    });
    fixture.detectChanges();

    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance['paso']()).toBe('datos');
    expect(pagina.querySelector('app-paso-datos-cosecha')).toBeTruthy();
  });

  it('precarga datos de la cosecha en modo edición', async () => {
    await crearComponente('cosecha-caturra-catalina');
    fixture.detectChanges();

    const selectFinca = pagina.querySelector<HTMLSelectElement>('#cosecha-finca');
    const selectVariedad = pagina.querySelector<HTMLSelectElement>('#cosecha-variedad');
    expect(selectFinca?.value).toBe('finca-la-catalina');
    expect(selectVariedad?.value).toBe('Caturra');
    expect(pagina.textContent).toContain('Repartiste el 100%');
  });

  it('avanza al paso 2 con peso antes precargado y muestra merma', async () => {
    await crearComponente();
    completarPaso1();

    expect(fixture.componentInstance['paso']()).toBe('seleccion');
    expect(pagina.querySelector('app-paso-seleccion-catacion')).toBeTruthy();
    expect(pagina.querySelector('#cosecha-peso-antes')).toBeTruthy();

    const paso2 = fixture.debugElement.query(By.directive(PasoSeleccionCatacionComponent))
      .componentInstance as PasoSeleccionCatacionComponent;
    expect(paso2['formulario'].controls.pesoAntesKg.value).toBe(120);

    paso2['formulario'].patchValue({ pesoTrasSeleccionKg: 96 });
    fixture.detectChanges();
    expect(paso2['mermaPorcentaje']()).toBe(20);
    expect(pagina.querySelector('#cosecha-merma')?.textContent).toContain('20');
  });

  it('permite guardar con caracolillo vacío sin invalidar el formulario', async () => {
    await crearComponente();
    completarPaso1();

    const paso2 = fixture.debugElement.query(By.directive(PasoSeleccionCatacionComponent))
      .componentInstance as PasoSeleccionCatacionComponent;
    paso2['formulario'].patchValue({
      pesoAntesKg: 120,
      pesoTrasSeleccionKg: 96,
      separoCaracolillo: '',
      pesoCaracolilloKg: null,
      puntajeSca: null,
      notasCatacion: '',
    });
    fixture.detectChanges();

    expect(paso2['formulario'].valid).toBe(true);
    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance['paso']()).toBe('exito');
    expect(pagina.querySelector('app-resumen-cosecha')).toBeTruthy();
  });

  it('guarda y muestra la pantalla de éxito', async () => {
    await crearComponente();
    completarPaso1();

    const paso2 = fixture.debugElement.query(By.directive(PasoSeleccionCatacionComponent))
      .componentInstance as PasoSeleccionCatacionComponent;
    paso2['formulario'].patchValue({
      pesoAntesKg: 120,
      pesoTrasSeleccionKg: 96,
    });
    fixture.detectChanges();
    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance['paso']()).toBe('exito');
    expect(pagina.querySelector('app-resumen-cosecha')).toBeTruthy();
    expect(pagina.querySelector('.panel--exito')).toBeTruthy();
    expect(pagina.querySelector('app-paso-seleccion-catacion')).toBeNull();
    expect(pagina.textContent).toContain('¡Cosecha registrada!');
    expect(pagina.textContent).toContain('Registrar otra cosecha');
    expect(pagina.textContent).toContain('Ver cosecha');
  });

  it('muestra la zona de peligro solo en modo edición', async () => {
    await crearComponente();
    expect(pagina.querySelector('app-zona-peligro')).toBeNull();
    expect(pagina.textContent).not.toContain('Zona de peligro');

    await crearComponente('cosecha-caturra-catalina');
    expect(pagina.querySelector('app-zona-peligro')).toBeTruthy();
    expect(pagina.textContent).toContain('Zona de peligro');
    expect(pagina.textContent).toContain('Eliminar cosecha');
  });

  it('abre el modal al eliminar y navega tras confirmar', async () => {
    await crearComponente('cosecha-caturra-catalina');
    const router = TestBed.inject(Router);
    const cosechaService = TestBed.inject(CosechaService);
    const navigateSpy = spyOn(router, 'navigateByUrl').and.resolveTo(true);
    const eliminarSpy = spyOn(cosechaService, 'eliminar').and.returnValue(true);

    pagina.querySelector<HTMLButtonElement>('.zona-peligro__boton')!.click();
    fixture.detectChanges();

    expect(pagina.querySelector('app-modal-confirmacion')).toBeTruthy();
    expect(pagina.textContent).toContain('¿Eliminar cosecha?');

    pagina.querySelector<HTMLButtonElement>('.modal__btn--peligro')!.click();
    fixture.detectChanges();

    expect(eliminarSpy).toHaveBeenCalledWith('cosecha-caturra-catalina');
    expect(navigateSpy).toHaveBeenCalledWith('/historial');
    expect(fixture.componentInstance['modalEliminarAbierto']()).toBe(false);
  });

  it('cierra el modal al cancelar sin eliminar', async () => {
    await crearComponente('cosecha-caturra-catalina');
    const cosechaService = TestBed.inject(CosechaService);
    const eliminarSpy = spyOn(cosechaService, 'eliminar');

    pagina.querySelector<HTMLButtonElement>('.zona-peligro__boton')!.click();
    fixture.detectChanges();
    expect(pagina.querySelector('app-modal-confirmacion')).toBeTruthy();

    pagina.querySelector<HTMLButtonElement>('.modal__btn--secundario')!.click();
    fixture.detectChanges();

    expect(eliminarSpy).not.toHaveBeenCalled();
    expect(pagina.querySelector('app-modal-confirmacion')).toBeNull();
  });
});
