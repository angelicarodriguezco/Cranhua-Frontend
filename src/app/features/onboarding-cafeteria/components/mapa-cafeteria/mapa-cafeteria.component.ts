import { Component, OnInit, inject, model } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { GoogleMap, MapAdvancedMarker } from '@angular/google-maps';

import { Coordenada } from '../../../../core/models/finca.model';
import { GoogleMapsService } from '../../../../core/services/google-maps.service';

const SAN_JOSE: Coordenada = { lat: 9.9326, lng: -84.0796 };

@Component({
  selector: 'app-mapa-cafeteria',
  imports: [GoogleMap, MapAdvancedMarker],
  templateUrl: './mapa-cafeteria.component.html',
  styleUrl: './mapa-cafeteria.component.css',
})
export class MapaCafeteriaComponent implements OnInit {
  readonly pin = model<Coordenada | null>(null);

  protected readonly apiCargada = toSignal(inject(GoogleMapsService).apiCargada);
  protected centro = SAN_JOSE;
  protected readonly opciones: google.maps.MapOptions = {
    mapId: 'DEMO_MAP_ID',
    zoom: 13,
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
  };
  protected readonly contenidoPin = Object.assign(inject(DOCUMENT).createElement('div'), {
    className: 'pin-mapa',
  });

  ngOnInit(): void {
    // Al volver a editar, el mapa abre sobre el local ya marcado
    this.centro = this.pin() ?? SAN_JOSE;
  }

  protected marcar(evento: google.maps.MapMouseEvent): void {
    if (evento.latLng) {
      this.pin.set(evento.latLng.toJSON());
    }
  }
}
