import { Component, OnInit, inject, model } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { GoogleMap, MapAdvancedMarker } from '@angular/google-maps';

import { Coordenada } from '../../../../core/models/negocio-tueste.model';
import { GoogleMapsService } from '../../../../core/services/google-maps.service';

// Centro de San José
const CENTRO_POR_DEFECTO: Coordenada = { lat: 9.9333, lng: -84.0833 };

@Component({
  selector: 'app-mapa-ubicacion',
  imports: [GoogleMap, MapAdvancedMarker],
  templateUrl: './mapa-ubicacion.component.html',
  styleUrl: './mapa-ubicacion.component.css',
})
export class MapaUbicacionComponent implements OnInit {
  readonly pin = model<Coordenada | null>(null);

  protected readonly apiCargada = toSignal(inject(GoogleMapsService).apiCargada);

  protected centroInicial = CENTRO_POR_DEFECTO;
  protected zoomInicial = 12;
  protected readonly opciones: google.maps.MapOptions = {
    // Los marcadores avanzados necesitan un mapId; con DEMO_MAP_ID no hace falta configurarlo en la consola
    mapId: 'DEMO_MAP_ID',
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    draggableCursor: 'crosshair',
    // El mapa está dentro de un formulario: con la rueda sola se sigue desplazando la página
    gestureHandling: 'cooperative',
  };

  protected readonly contenidoPin = inject(DOCUMENT).createElement('div');

  constructor() {
    this.contenidoPin.className = 'pin-mapa';
  }

  ngOnInit(): void {
    // Al volver a editar, el mapa abre sobre el pin ya marcado
    const pin = this.pin();
    if (pin) {
      this.centroInicial = pin;
      this.zoomInicial = 15;
    }
  }

  protected marcar(evento: google.maps.MapMouseEvent): void {
    if (evento.latLng) {
      this.pin.set(evento.latLng.toJSON());
    }
  }
}
