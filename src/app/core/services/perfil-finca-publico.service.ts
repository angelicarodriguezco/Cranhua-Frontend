import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { perfilFincaPublicoDesdeApi } from '../mappers/perfil-finca-publico.mapper';
import {
  PerfilFincaPublico,
  PerfilFincaPublicoResponseApi,
} from '../models/perfil-finca-publico.model';

const opcionesCredenciales = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class PerfilFincaPublicoService {
  private readonly http = inject(HttpClient);

  obtener(id: string): Observable<PerfilFincaPublico | null> {
    return this.http
      .get<PerfilFincaPublicoResponseApi>(
        `${environment.apiUrl}/api/publico/fincas/${id}`,
        opcionesCredenciales,
      )
      .pipe(
        map(perfilFincaPublicoDesdeApi),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(null);
          }
          return throwError(() => error);
        }),
      );
  }
}
