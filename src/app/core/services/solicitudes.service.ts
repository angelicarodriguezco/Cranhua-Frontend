import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { DETALLES_COSECHA } from '../mocks/detalle-cosecha.mock';
import { SOLICITUDES, haceDias } from '../mocks/solicitudes.mock';
import { NuevaSolicitud } from '../models/detalle-cosecha.model';
import { IndicadoresSolicitudes, Solicitud } from '../models/solicitud.model';

export function calcularIndicadores(
  solicitudes: Solicitud[],
  hoy = new Date(),
): IndicadoresSolicitudes {
  const mesActual = haceDias(0, hoy).slice(0, 7);
  return {
    pendientes: solicitudes.filter((s) => s.estado === 'Pendiente').length,
    esteMes: solicitudes.filter((s) => s.fecha.startsWith(mesActual)).length,
    fincasContactadas: new Set(solicitudes.map((s) => s.finca)).size,
  };
}

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private readonly solicitudes: Solicitud[] = [...SOLICITUDES];

  listar(): Observable<Solicitud[]> {
    return of([...this.solicitudes].sort((a, b) => b.fecha.localeCompare(a.fecha)));
  }

  crear(nueva: NuevaSolicitud): Observable<Solicitud> {
    const cosecha = DETALLES_COSECHA.find((c) => c.id === nueva.cosechaId);
    const solicitud: Solicitud = {
      id: `sol-${this.solicitudes.length + 1}`,
      cosechaId: nueva.cosechaId,
      finca: cosecha?.finca ?? '—',
      lote: cosecha ? `${cosecha.variedad} · ${cosecha.proceso}` : '—',
      kilos: nueva.kilos,
      fecha: haceDias(0),
      estado: 'Pendiente',
    };
    this.solicitudes.push(solicitud);
    return of(solicitud);
  }
}
