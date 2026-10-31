import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { FINCAS_REGISTRADAS } from '../../../../core/mocks/finca.mock';
import { GoogleMapsService } from '../../../../core/services/google-maps.service';
import { formatearHectareas } from '../../../../shared/utils/formato';
import { MapaPerimetroComponent } from './mapa-perimetro.component';

describe('MapaPerimetroComponent', () => {
  let fixture: ComponentFixture<MapaPerimetroComponent>;
  const finca = FINCAS_REGISTRADAS[0];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaPerimetroComponent],
      // Sin cargar Google Maps
      providers: [{ provide: GoogleMapsService, useValue: { apiCargada: of(false) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(MapaPerimetroComponent);
    fixture.componentRef.setInput('perimetro', finca.perimetro);
    fixture.detectChanges();
  });

  it('muestra el área del perímetro en hectáreas', () => {
    const area: HTMLElement = fixture.nativeElement.querySelector('.area');
    expect(area.textContent).toContain(formatearHectareas(finca.areaHectareas));
  });

  it('avisa cuando Google Maps no carga', () => {
    expect(fixture.nativeElement.querySelector('.aviso').textContent).toContain(
      'No se pudo cargar',
    );
  });
});
