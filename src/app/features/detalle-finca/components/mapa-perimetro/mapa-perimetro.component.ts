import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { GoogleMap, MapPolygon } from '@angular/google-maps';

import { Coordenada } from '../../../../core/models/finca.model';
import { GoogleMapsService } from '../../../../core/services/google-maps.service';
import { formatearHectareas } from '../../../../shared/utils/formato';
import { areaHectareas, centroide } from '../../../../shared/utils/geo';

// Mapa de solo lectura: el perímetro se edita en el formulario de finca (CP3-22)
@Component({
  selector: 'app-mapa-perimetro',
  imports: [GoogleMap, MapPolygon],
  templateUrl: './mapa-perimetro.component.html',
  styleUrl: './mapa-perimetro.component.css',
})
export class MapaPerimetroComponent {
  readonly perimetro = input.required<Coordenada[]>();

  protected readonly apiCargada = toSignal(inject(GoogleMapsService).apiCargada);
  protected readonly area = computed(() => formatearHectareas(areaHectareas(this.perimetro())));
  protected readonly centro = computed(() => centroide(this.perimetro()));

  protected readonly opciones: google.maps.MapOptions = {
    mapTypeId: 'hybrid',
    zoom: 16,
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    gestureHandling: 'cooperative',
  };
  protected readonly estilo: google.maps.PolygonOptions = {
    clickable: false,
    strokeColor: '#d9a441',
    strokeWeight: 2,
    fillColor: '#a57008',
    fillOpacity: 0.3,
  };

  protected encuadrar(mapa: google.maps.Map): void {
    const limites = new google.maps.LatLngBounds();
    this.perimetro().forEach((p) => limites.extend(p));
    mapa.fitBounds(limites, 32);
  }
}
