import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { cosechaDePrueba } from '../../../../core/testing/cosechas-de-prueba';
import { TablaCosechasComponent } from './tabla-cosechas.component';

describe('TablaCosechasComponent', () => {
  let fixture: ComponentFixture<TablaCosechasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaCosechasComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TablaCosechasComponent);
  });

  function celdas(): string[] {
    return [...fixture.nativeElement.querySelectorAll('tbody td')].map((td) =>
      td.textContent.trim().replace(/\s/g, ' '),
    );
  }

  it('muestra variedad, proceso, lote, precio, kg disponibles y estado', () => {
    fixture.componentRef.setInput('cosechas', [cosechaDePrueba({ codigoLote: 'CRH-2026-0007', estado: 'PUBLICADA' })]);
    fixture.detectChanges();

    expect(celdas()).toEqual([
      'Geisha',
      'Lavado',
      'CRH-2026-0007',
      '₡4 500',
      '720 kg',
      'Publicada',
      'Editar →',
    ]);
  });

  it('sin pesos muestra "—" en lote y kg disponibles', () => {
    fixture.componentRef.setInput('cosechas', [
      cosechaDePrueba({ estado: 'BORRADOR', kgDisponibles: null, precioKg: 3800 }),
    ]);
    fixture.detectChanges();

    expect(celdas().slice(2, 6)).toEqual(['—', '₡3 800', '—', 'Borrador']);
  });

  it('cada fila abre la edición de su cosecha', () => {
    fixture.componentRef.setInput('cosechas', [cosechaDePrueba()]);
    fixture.detectChanges();

    const enlace = fixture.debugElement.query(By.css('tr.fila-enlace a'));
    expect(enlace.injector.get(RouterLink).href).toBe('/cafetalero/cosechas/c-1/editar');
  });

  it('resalta la cosecha indicada y hace scroll hasta ella', () => {
    const scroll = spyOn(Element.prototype, 'scrollIntoView');
    fixture.componentRef.setInput('cosechas', [
      cosechaDePrueba({ id: 'c-1' }),
      cosechaDePrueba({ id: 'c-2', variedad: 'Caturra' }),
    ]);
    fixture.componentRef.setInput('resaltada', 'c-2');
    fixture.detectChanges();

    const resaltadas = fixture.nativeElement.querySelectorAll('tr.fila-resaltada');
    expect(resaltadas.length).toBe(1);
    expect(resaltadas[0].textContent).toContain('Caturra');
    expect(scroll).toHaveBeenCalled();
    expect(scroll.calls.mostRecent().object).toBe(resaltadas[0]);
  });

  it('avisa cuando la finca no tiene cosechas', () => {
    fixture.componentRef.setInput('cosechas', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    expect(fixture.nativeElement.querySelector('.vacio').textContent).toContain(
      'todavía no tiene cosechas',
    );
  });
});
