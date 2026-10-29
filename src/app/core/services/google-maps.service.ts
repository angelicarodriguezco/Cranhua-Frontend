import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, shareReplay } from 'rxjs';

import { environment } from '../../../environments/environment';

// El script de Maps no se puede incluir dos veces, así que se carga una sola vez para toda la app
@Injectable({ providedIn: 'root' })
export class GoogleMapsService {
  private http = inject(HttpClient);

  readonly apiCargada = this.http
    .jsonp(
      `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=marker`,
      'callback',
    )
    .pipe(
      map(() => true),
      catchError(() => of(false)),
      shareReplay(1),
    );
}
