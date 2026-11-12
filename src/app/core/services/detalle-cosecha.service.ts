import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';

import { DETALLES_COSECHA } from '../mocks/detalle-cosecha.mock';
import { DetalleCosecha, NuevaSolicitud } from '../models/detalle-cosecha.model';
import { SolicitudesService } from './solicitudes.service';

@Injectable({ providedIn: 'root' })
export class DetalleCosechaService {
  private readonly solicitudes = inject(SolicitudesService);

  obtener(id: string): Observable<DetalleCosecha | undefined> {
    return of(DETALLES_COSECHA.find((c) => c.id === id));
  }

  enviarSolicitud(solicitud: NuevaSolicitud): Observable<NuevaSolicitud> {
    return this.solicitudes.crear(solicitud).pipe(map(() => solicitud));
  }
}
