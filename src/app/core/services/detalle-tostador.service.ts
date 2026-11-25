import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { detalleTostadorDesdeApi } from '../mappers/tostador-exploracion.mapper';
import { DetalleTostador, DetalleTostadorApi } from '../models/detalle-tostador.model';

@Injectable({ providedIn: 'root' })
export class DetalleTostadorService {
  private readonly http = inject(HttpClient);

  obtener(id: string): Observable<DetalleTostador | undefined> {
    return this.http
      .get<DetalleTostadorApi>(`${environment.apiUrl}/api/tostadores/${encodeURIComponent(id)}`, {
        withCredentials: true,
      })
      .pipe(
        map(detalleTostadorDesdeApi),
        catchError((error: HttpErrorResponse) =>
          error.status === 404 ? of(undefined) : throwError(() => error),
        ),
      );
  }
}
