import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  cuerpoCrearSolicitud,
  estadoSolicitudDesdeApi,
  fechaLocalDesdeInstant,
  solicitudesEnviadasDesdeApi,
} from '../mappers/solicitud.mapper';
import { NuevaSolicitud } from '../models/detalle-cosecha.model';
import {
  ErrorSolicitud,
  IndicadoresSolicitudes,
  Solicitud,
  SolicitudCreadaApi,
  SolicitudesEnviadas,
  SolicitudesEnviadasResponseApi,
} from '../models/solicitud.model';

const opcionesCredenciales = { withCredentials: true as const };
const ERROR_SOLICITUD = 'No pudimos enviar la solicitud. Intentá de nuevo.';

export function calcularIndicadores(
  solicitudes: Solicitud[],
  hoy = new Date(),
): IndicadoresSolicitudes {
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const mesActual = `${hoy.getFullYear()}-${mes}`;
  return {
    pendientes: solicitudes.filter((s) => s.estado === 'Pendiente').length,
    esteMes: solicitudes.filter((s) => s.fecha.startsWith(mesActual)).length,
    fincasContactadas: new Set(solicitudes.map((s) => s.finca)).size,
  };
}

function solicitudDesdeCreada(api: SolicitudCreadaApi): Solicitud {
  return {
    id: api.id,
    cosechaId: api.cosechaId,
    finca: '—',
    lote: api.codigoLote ?? '—',
    kilos: Number(api.cantidadKg),
    fecha: fechaLocalDesdeInstant(api.solicitadaEn),
    estado: estadoSolicitudDesdeApi(api.estado),
  };
}

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private readonly http = inject(HttpClient);

  private get base(): string {
    return `${environment.apiUrl}/api/solicitudes`;
  }

  listar(): Observable<SolicitudesEnviadas> {
    return this.http
      .get<SolicitudesEnviadasResponseApi>(`${this.base}/enviadas`, opcionesCredenciales)
      .pipe(
        map((api) => {
          const mapeadas = solicitudesEnviadasDesdeApi(api);
          return {
            indicadores: mapeadas.indicadores,
            solicitudes: [...mapeadas.solicitudes].sort((a, b) => b.fecha.localeCompare(a.fecha)),
          };
        }),
      );
  }

  crear(nueva: NuevaSolicitud): Observable<Solicitud> {
    return this.http
      .post<SolicitudCreadaApi>(this.base, cuerpoCrearSolicitud(nueva), opcionesCredenciales)
      .pipe(
        map(solicitudDesdeCreada),
        catchError((error: HttpErrorResponse) => throwError(() => this.errorSolicitud(error))),
      );
  }

  private errorSolicitud(error: HttpErrorResponse): ErrorSolicitud {
    if (error.status === 400) {
      return {
        mensaje: error.error?.mensaje ?? ERROR_SOLICITUD,
        errores: error.error?.errores ?? {},
      };
    }
    return { mensaje: ERROR_SOLICITUD, errores: {} };
  }
}
