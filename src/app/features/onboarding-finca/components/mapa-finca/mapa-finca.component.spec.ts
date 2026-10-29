import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';

import { GoogleMapsService } from '../../../../core/services/google-maps.service';
import { Coordenada } from '../../../../core/models/finca.model';
import { centroide } from '../../../../shared/utils/geo';
import { MapaFincaComponent } from './mapa-finca.component';

function clic(punto: Coordenada) {
  return { latLng: { toJSON: () => punto } } as google.maps.MapMouseEvent;
}

const A = { lat: 9.65, lng: -84.03 };
const B = { lat: 9.65, lng: -84.029 };
const C = { lat: 9.651, lng: -84.029 };

describe('MapaFincaComponent', () => {
  let fixture: ComponentFixture<MapaFincaComponent>;
  let mapa: MapaFincaComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaFincaComponent],
      // Sin cargar Google Maps: se prueba la lógica de dibujo
      providers: [{ provide: GoogleMapsService, useValue: { apiCargada: NEVER } }],
    }).compileComponents();

    fixture = TestBed.createComponent(MapaFincaComponent);
    mapa = fixture.componentInstance;
    fixture.detectChanges();
  });

  function dibujar(...puntos: Coordenada[]) {
    puntos.forEach((p) => mapa['agregarVertice'](clic(p)));
  }

  it('agrega esquinas y pone el pin en el centro al cerrar el polígono', () => {
    dibujar(A, B);
    expect(mapa.pin()).toBeNull();

    dibujar(C);
    expect(mapa.perimetro()).toEqual([A, B, C]);
    expect(mapa.pin()).toEqual(centroide([A, B, C]));
  });

  it('no agrega esquinas con el lápiz apagado', () => {
    mapa['alternarLapiz']();
    dibujar(A);
    expect(mapa.perimetro()).toEqual([]);
  });

  it('deshace el último cambio y borra todo', () => {
    dibujar(A, B, C);
    mapa['deshacer']();
    expect(mapa.perimetro()).toEqual([A, B]);
    expect(mapa.pin()).toBeNull();

    mapa['borrar']();
    expect(mapa.perimetro()).toEqual([]);
    mapa['deshacer']();
    expect(mapa.perimetro()).toEqual([A, B]);
  });

  it('el pin deja de seguir al centro cuando se arrastra', () => {
    dibujar(A, B, C);
    const arrastrado = { lat: 9.6502, lng: -84.0295 };
    mapa['moverPin'](clic(arrastrado));
    mapa['moverVertice'](2, clic({ lat: 9.652, lng: -84.028 }));
    expect(mapa.pin()).toEqual(arrastrado);
  });

  it('es de solo lectura mientras hay conflicto', () => {
    fixture.componentRef.setInput('conflicto', { perimetro: [A, B, C] });
    dibujar(A);
    expect(mapa.perimetro()).toEqual([]);
  });
});
