import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { DETALLES_COSECHA } from '../mocks/detalle-cosecha.mock';
import { DetalleCosecha, NuevaSolicitud } from '../models/detalle-cosecha.model';

@Injectable({ providedIn: 'root' })
export class DetalleCosechaService {
  private readonly solicitudes: NuevaSolicitud[] = [];

  obtener(id: string): Observable<DetalleCosecha | undefined> {
    return of(DETALLES_COSECHA.find((c) => c.id === id));
  }

  enviarSolicitud(solicitud: NuevaSolicitud): Observable<NuevaSolicitud> {
    this.solicitudes.push(solicitud);
    return of(solicitud);
  }
}