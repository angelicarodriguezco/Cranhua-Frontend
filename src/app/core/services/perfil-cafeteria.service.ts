import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { perfilCafeteriaDesdeApi } from '../mappers/perfil-cafeteria.mapper';
import {
  PerfilCafeteria,
  PerfilCafeteriaResponseApi,
} from '../models/perfil-cafeteria.model';

const opcionesCredenciales = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class PerfilCafeteriaService {
  private readonly http = inject(HttpClient);

  obtener(id: string): Observable<PerfilCafeteria | null> {
    return this.http
      .get<PerfilCafeteriaResponseApi>(
        `${environment.apiUrl}/api/publico/cafeterias/${id}`,
        opcionesCredenciales,
      )
      .pipe(
        map(perfilCafeteriaDesdeApi),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(null);
          }
          return throwError(() => error);
        }),
      );
  }
}
