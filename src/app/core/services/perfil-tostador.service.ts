import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { perfilTostadorDesdeApi } from '../mappers/perfil-tostador.mapper';
import { PerfilTostador, PerfilTostadorResponseApi } from '../models/perfil-tostador.model';

const opcionesCredenciales = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class PerfilTostadorService {
  private readonly http = inject(HttpClient);

  obtener(id: string): Observable<PerfilTostador | null> {
    return this.http
      .get<PerfilTostadorResponseApi>(
        `${environment.apiUrl}/api/publico/tostadores/${id}`,
        opcionesCredenciales,
      )
      .pipe(
        map(perfilTostadorDesdeApi),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(null);
          }
          return throwError(() => error);
        }),
      );
  }
}
