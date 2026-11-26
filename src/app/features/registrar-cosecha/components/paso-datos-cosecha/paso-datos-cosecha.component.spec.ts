import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { FINCAS_REGISTRADAS } from '../../../../core/mocks/finca.mock';
import { FincaService } from '../../../../core/services/finca.service';

import { DatosPasoCosecha, PasoDatosCosechaComponent } from './paso-datos-cosecha.component';

describe('PasoDatosCosechaComponent', () => {
  let fixture: ComponentFixture<PasoDatosCosechaComponent>;
  let pagina: HTMLElement;
  let componente: PasoDatosCosechaComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasoDatosCosechaComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: FincaService, useValue: { misFincas: () => of(FINCAS_REGISTRADAS) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PasoDatosCosechaComponent);
    componente = fixture.componentInstance;
    pagina = fixture.nativeElement;
    fixture.detectChanges();
  });

  function rellenarDatosValidos(porcentaje = 100): void {
    const form = componente['formulario'];
    form.patchValue({
      fincaId: 'finca-la-catalina',
      variedad: 'Caturra',
      alturaMsnm: 1650,
      cantidadTotalKg: 120,
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-10',
    });
    form.controls.procesos.at(0).patchValue({
      proceso: 'Honey',
      porcentaje,
    });
    fixture.detectChanges();
  }

  it('muestra los campos de datos y el reparto de procesos', () => {
    expect(pagina.querySelectorAll('.tarjeta').length).toBe(2);
    expect(pagina.textContent).toContain('Datos de la cosecha');
    expect(pagina.textContent).toContain('Distribución por proceso de beneficiado');
    expect(pagina.querySelector('#cosecha-finca')).toBeTruthy();
    expect(pagina.querySelector('#cosecha-variedad')).toBeTruthy();
    expect(pagina.querySelector('#cosecha-altura')).toBeTruthy();
    expect(pagina.querySelector('#cosecha-cantidad')).toBeTruthy();
    expect(pagina.querySelector('#cosecha-inicio')).toBeTruthy();
    expect(pagina.querySelector('#cosecha-fin')).toBeTruthy();
    expect(pagina.querySelector('#proceso-0')).toBeTruthy();
    expect(pagina.querySelector('#porcentaje-0')).toBeTruthy();
    expect(pagina.querySelector('.reparto__punto')).toBeTruthy();
    expect(componente['formulario'].controls.procesos.at(0).controls.proceso.value).toBeTruthy();
    expect(pagina.querySelector('.btn-agregar')?.textContent?.trim()).toBe('+ Agregar proceso');
    expect(pagina.querySelector('button[type="submit"]')?.textContent?.trim()).toBe('Continuar →');
    expect(pagina.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(false);
    expect(pagina.textContent).toContain('% asignado');
  });

  it('bloquea Continuar cuando los porcentajes no suman 100', () => {
    const emitidos: DatosPasoCosecha[] = [];
    componente.continuar.subscribe((datos) => emitidos.push(datos));

    rellenarDatosValidos(40);
    expect(componente['sumaPorcentaje']()).toBe(40);
    expect(pagina.textContent).toContain('Todavía falta repartir');

    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(emitidos).toEqual([]);
    expect(componente['formulario'].controls.procesos.hasError('sumaPorcentajes')).toBe(true);
  });

  it('emite los datos al Continuar cuando el reparto suma 100%', () => {
    const emitidos: DatosPasoCosecha[] = [];
    componente.continuar.subscribe((datos) => emitidos.push(datos));

    rellenarDatosValidos(100);
    expect(pagina.textContent).toContain('Repartiste el 100%');

    pagina.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(emitidos).toEqual([
      {
        fincaId: 'finca-la-catalina',
        variedad: 'Caturra',
        alturaMsnm: 1650,
        cantidadTotalKg: 120,
        fechaInicio: '2026-01-01',
        fechaFin: '2026-01-10',
        procesos: [{ proceso: 'Honey', porcentaje: 100 }],
      },
    ]);
  });

  it('exige altura y porcentaje de cada proceso de al menos 1', () => {
    rellenarDatosValidos(0);
    const form = componente['formulario'];
    form.patchValue({ alturaMsnm: 0 });
    fixture.detectChanges();

    expect(form.controls.alturaMsnm.hasError('min')).toBeTrue();
    expect(form.controls.procesos.at(0).controls.porcentaje.hasError('min')).toBeTrue();

    form.markAllAsTouched();
    fixture.detectChanges();
    expect(pagina.textContent).toContain('Indicá una altura mayor a 0 msnm.');
    expect(pagina.textContent).toContain('Entre 1 y 100');

    form.patchValue({ alturaMsnm: 1 });
    form.controls.procesos.at(0).patchValue({ porcentaje: 1 });
    expect(form.controls.alturaMsnm.valid).toBeTrue();
    expect(form.controls.procesos.at(0).controls.porcentaje.valid).toBeTrue();
  });

  it('permite agregar y eliminar filas de proceso', () => {
    expect(componente['procesos'].length).toBe(1);

    pagina.querySelector<HTMLButtonElement>('.btn-agregar')!.click();
    fixture.detectChanges();
    expect(componente['procesos'].length).toBe(2);
    expect(pagina.querySelector('#proceso-1')).toBeTruthy();

    pagina.querySelectorAll<HTMLButtonElement>('.reparto__eliminar')[1].click();
    fixture.detectChanges();
    expect(componente['procesos'].length).toBe(1);
  });

  it('el selector lista las fincas del usuario', () => {
    const opciones = [...pagina.querySelectorAll('#cosecha-finca option')].map((o) =>
      o.textContent?.trim(),
    );
    expect(opciones.slice(1)).toEqual(FINCAS_REGISTRADAS.map((f) => f.nombre));
  });

  it('muestra los errores del servidor debajo de su campo', () => {
    fixture.componentRef.setInput('erroresServidor', {
      fechaFin: 'La fecha de fin no puede ser antes de la de inicio.',
      procesos: 'Los porcentajes de los procesos tienen que sumar 100.',
    });
    fixture.detectChanges();

    expect(pagina.querySelector('#cosecha-fin')?.parentElement?.textContent).toContain(
      'La fecha de fin no puede ser antes de la de inicio.',
    );
    expect(pagina.textContent).toContain('Los porcentajes de los procesos tienen que sumar 100.');
  });

  it('muestra feedback de exceso cuando se supera el 100%', () => {
    rellenarDatosValidos(150);
    expect(pagina.textContent).toContain('Te pasaste del 100%');
    expect(pagina.textContent).toContain('150% asignado');
  });
});
