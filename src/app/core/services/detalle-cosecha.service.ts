import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { detalleCosechaDesdeApi } from '../mappers/cosecha-disponible.mapper';
import {
  DetalleCosecha,
  DetalleCosechaDisponibleApi,
  NuevaSolicitud,
} from '../models/detalle-cosecha.model';
import { SolicitudesService } from './solicitudes.service';

const opcionesCredenciales = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class DetalleCosechaService {
  private readonly http = inject(HttpClient);
  private readonly solicitudes = inject(SolicitudesService);

  private get base(): string {
    return `${environment.apiUrl}/api/cosechas/disponibles`;
  }

  obtener(id: string): Observable<DetalleCosecha | undefined> {
    if (!id) {
      return of(undefined);
    }
    return this.http
      .get<DetalleCosechaDisponibleApi>(`${this.base}/${id}`, opcionesCredenciales)
      .pipe(
        map(detalleCosechaDesdeApi),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(undefined);
          }
          return throwError(() => error);
        }),
      );
  }

  enviarSolicitud(solicitud: NuevaSolicitud): Observable<NuevaSolicitud> {
    return this.solicitudes.crear(solicitud).pipe(map(() => solicitud));
  }
}
