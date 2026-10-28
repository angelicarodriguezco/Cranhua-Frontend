import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { GoogleMap } from '@angular/google-maps';

import { GoogleMapsService } from '../../core/services/google-maps.service';

@Component({
  selector: 'app-mapa-prueba',
  imports: [AsyncPipe, GoogleMap],
  templateUrl: './mapa-prueba.component.html',
  styleUrl: './mapa-prueba.component.css',
})
export class MapaPruebaComponent {
  centro: google.maps.LatLngLiteral = { lat: 9.9281, lng: -84.0907 };
  zoom = 8;

  apiCargada = inject(GoogleMapsService).apiCargada;
}
