import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { menuPublicoDesdeApi } from '../mappers/menu-publico.mapper';
import { MenuPublico, MenuPublicoResponseApi } from '../models/menu-publico.model';

const opcionesCredenciales = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class MenuPublicoService {
  private readonly http = inject(HttpClient);

  obtener(cafeteriaId: string): Observable<MenuPublico | null> {
    return this.http
      .get<MenuPublicoResponseApi>(
        `${environment.apiUrl}/api/publico/cafeterias/${cafeteriaId}/menu`,
        opcionesCredenciales,
      )
      .pipe(
        map(menuPublicoDesdeApi),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(null);
          }
          return throwError(() => error);
        }),
      );
  }
}
