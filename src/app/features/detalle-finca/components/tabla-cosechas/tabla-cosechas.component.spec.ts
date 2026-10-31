import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { COSECHAS_REGISTRADAS } from '../../../../core/mocks/cosecha.mock';
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

  it('muestra variedad, proceso, lote y estado de cada cosecha', () => {
    const cosecha = COSECHAS_REGISTRADAS[0];
    fixture.componentRef.setInput('cosechas', [cosecha]);
    fixture.detectChanges();

    const celdas = [...fixture.nativeElement.querySelectorAll('tbody td')].map((td) =>
      td.textContent.trim(),
    );
    expect(celdas).toEqual([
      cosecha.variedad,
      cosecha.proceso,
      cosecha.codigoLote,
      `${cosecha.kgDisponibles} kg`,
      cosecha.estado,
    ]);
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
