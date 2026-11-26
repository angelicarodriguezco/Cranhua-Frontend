import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { cuerpoNegocioTueste, negocioTuesteDesdeApi } from '../mappers/negocio-tueste.mapper';
import {
  DatosNegocioTueste,
  NegocioTueste,
  NegocioTuesteApi,
} from '../models/negocio-tueste.model';

const opcionesCredenciales = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class NegocioTuesteService {
  private readonly http = inject(HttpClient);

  private get base(): string {
    return `${environment.apiUrl}/api/tostadores`;
  }

  registrar(datos: DatosNegocioTueste): Observable<NegocioTueste> {
    return this.http
      .post<NegocioTuesteApi>(this.base, cuerpoNegocioTueste(datos), opcionesCredenciales)
      .pipe(map(negocioTuesteDesdeApi));
  }

  actualizar(id: string, datos: DatosNegocioTueste): Observable<NegocioTueste> {
    return this.http
      .patch<NegocioTuesteApi>(
        `${this.base}/${id}`,
        cuerpoNegocioTueste(datos),
        opcionesCredenciales,
      )
      .pipe(map(negocioTuesteDesdeApi));
  }

  actualizarPortada(id: string, archivo: File): Observable<NegocioTueste> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http
      .post<NegocioTuesteApi>(`${this.base}/${id}/portada`, formData, opcionesCredenciales)
      .pipe(map(negocioTuesteDesdeApi));
  }

  obtenerActual(): Observable<NegocioTueste | undefined> {
    return this.http.get<NegocioTuesteApi>(`${this.base}/actual`, opcionesCredenciales).pipe(
      map(negocioTuesteDesdeApi),
      catchError((error: HttpErrorResponse) =>
        error.status === 404 ? of(undefined) : throwError(() => error),
      ),
    );
  }
}
