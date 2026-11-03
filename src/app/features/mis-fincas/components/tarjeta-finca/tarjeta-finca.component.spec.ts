import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FINCAS_REGISTRADAS } from '../../../../core/mocks/finca.mock';
import { TarjetaFincaComponent } from './tarjeta-finca.component';

describe('TarjetaFincaComponent', () => {
  let fixture: ComponentFixture<TarjetaFincaComponent>;
  const finca = FINCAS_REGISTRADAS.find((f) => f.id === 'f-la-esperanza')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaFincaComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaFincaComponent);
    fixture.componentRef.setInput('finca', finca);
    fixture.detectChanges();
  });

  it('muestra nombre, ubicación, pills y enlaza al detalle', () => {
    const pagina: HTMLElement = fixture.nativeElement;
    expect(pagina.querySelector('.tarjeta__nombre')?.textContent).toContain(finca.nombre);
    expect(pagina.textContent).toContain('Costa Rica');
    expect(pagina.querySelectorAll('.tarjeta__pills li').length).toBe(3);
    expect(pagina.textContent).toContain('dueño');

    const enlace = pagina.querySelector<HTMLAnchorElement>('a.tarjeta__accion');
    expect(enlace?.textContent).toContain('Ver detalle');
    expect(enlace?.getAttribute('href')).toBe(`/cafetalero/fincas/${finca.id}`);
  });
});
