import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GoogleMap } from '@angular/google-maps';
import { catchError, map, of } from 'rxjs';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-mapa-prueba',
  imports: [AsyncPipe, GoogleMap],
  templateUrl: './mapa-prueba.component.html',
  styleUrl: './mapa-prueba.component.css',
})
export class MapaPruebaComponent {
  private http = inject(HttpClient);

  centro: google.maps.LatLngLiteral = { lat: 9.9281, lng: -84.0907 };
  zoom = 8;

  apiCargada = this.http
    .jsonp(
      `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}`,
      'callback',
    )
    .pipe(
      map(() => true),
      catchError(() => of(false)),
    );
}
