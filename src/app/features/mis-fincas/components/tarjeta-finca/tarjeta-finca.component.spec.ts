import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FINCAS_REGISTRADAS } from '../../../../core/mocks/finca.mock';
import { TarjetaFincaComponent } from './tarjeta-finca.component';

describe('TarjetaFincaComponent', () => {
  let fixture: ComponentFixture<TarjetaFincaComponent>;
  const finca = FINCAS_REGISTRADAS[0];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaFincaComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaFincaComponent);
    fixture.componentRef.setInput('finca', finca);
    fixture.detectChanges();
  });

  it('muestra el nombre y enlaza al detalle de la finca', () => {
    const enlace: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(enlace.textContent).toContain(finca.nombre);
    expect(enlace.getAttribute('href')).toBe(`/cafetalero/fincas/${finca.id}`);
  });
});
