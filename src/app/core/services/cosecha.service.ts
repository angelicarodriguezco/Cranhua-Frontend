import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Cosecha, CosechaResponseApi, ErrorCosecha, NuevaCosecha } from '../models/cosecha.model';
import { cosechaDesdeApi } from '../utils/cosecha-desde-api';
import { DashboardCafetaleroService } from './dashboard-cafetalero.service';

const ERROR_REGISTRO = 'No pudimos registrar la cosecha. Intentá de nuevo.';
const ERROR_CARGA = 'No pudimos cargar la cosecha. Intentá de nuevo.';
const ERROR_ESTADO = 'No pudimos cambiar el estado de la cosecha. Intentá de nuevo.';
const ERROR_ACTUALIZAR = 'No pudimos guardar los cambios de la cosecha. Intentá de nuevo.';
const ERROR_ELIMINAR = 'No pudimos eliminar la cosecha. Intentá de nuevo.';

const opcionesCredenciales = { withCredentials: true as const };

function errorCosecha(
  error: HttpErrorResponse,
  porDefecto: string,
  conEstado = false,
): ErrorCosecha {
  const fallo: ErrorCosecha = {
    mensaje: error.error?.mensaje ?? porDefecto,
    errores: error.error?.errores ?? {},
  };
  return conEstado ? { ...fallo, estado: error.status } : fallo;
}

function cuerpoCosecha(datos: Omit<NuevaCosecha, 'fincaId'>) {
  return {
    variedad: datos.variedad,
    alturaMsnm: datos.alturaMsnm,
    fechaInicio: datos.fechaInicio,
    fechaFin: datos.fechaFin,
    procesos: datos.procesos,
    cantidadCosechadaKg: datos.cantidadTotalKg,
    pesoTrasBeneficiadoKg: datos.pesoAntesKg,
    pesoTrasSeleccionKg: datos.pesoTrasSeleccionKg,
    caracolilloKg: datos.separoCaracolillo === true ? datos.pesoCaracolilloKg : null,
    notasSabor: datos.notasCatacion,
    puntajeSca: datos.puntajeSca,
    precioKg: datos.precioKg,
  };
}

@Injectable({ providedIn: 'root' })
export class CosechaService {
  private readonly http = inject(HttpClient);
  private readonly dashboard = inject(DashboardCafetaleroService);

  private get base(): string {
    return `${environment.apiUrl}/api/cosechas`;
  }

  registrar(datos: NuevaCosecha): Observable<Cosecha> {
    const cuerpo = { fincaId: datos.fincaId, ...cuerpoCosecha(datos) };
    return this.http.post<CosechaResponseApi>(this.base, cuerpo, opcionesCredenciales).pipe(
      map(cosechaDesdeApi),
      tap((cosecha) => this.sincronizarDashboard(cosecha)),
      catchError((error: HttpErrorResponse) =>
        throwError(() => errorCosecha(error, ERROR_REGISTRO)),
      ),
    );
  }

  // Reemplazo completo: el backend no deja cambiar la finca de una cosecha
  actualizar(id: string, datos: Omit<NuevaCosecha, 'fincaId'>): Observable<Cosecha> {
    return this.http
      .patch<CosechaResponseApi>(`${this.base}/${id}`, cuerpoCosecha(datos), opcionesCredenciales)
      .pipe(
        map(cosechaDesdeApi),
        tap((cosecha) => this.sincronizarDashboard(cosecha)),
        catchError((error: HttpErrorResponse) =>
          throwError(() => errorCosecha(error, ERROR_ACTUALIZAR, true)),
        ),
      );
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, opcionesCredenciales).pipe(
      tap(() => this.dashboard.eliminarCosechaReciente(id)),
      catchError((error: HttpErrorResponse) =>
        throwError(() => errorCosecha(error, ERROR_ELIMINAR, true)),
      ),
    );
  }

  cambiarEstado(id: string, estado: 'PUBLICADA' | 'BORRADOR'): Observable<Cosecha> {
    return this.http
      .patch<CosechaResponseApi>(`${this.base}/${id}/estado`, { estado }, opcionesCredenciales)
      .pipe(
        map(cosechaDesdeApi),
        tap((cosecha) => this.sincronizarDashboard(cosecha)),
        catchError((error: HttpErrorResponse) =>
          throwError(() => errorCosecha(error, ERROR_ESTADO)),
        ),
      );
  }

  obtener(id: string): Observable<Cosecha> {
    return this.http.get<CosechaResponseApi>(`${this.base}/${id}`, opcionesCredenciales).pipe(
      map(cosechaDesdeApi),
      catchError((error: HttpErrorResponse) => throwError(() => errorCosecha(error, ERROR_CARGA))),
    );
  }

  deFinca(fincaId: string): Observable<Cosecha[]> {
    return this.http
      .get<
        CosechaResponseApi[]
      >(`${environment.apiUrl}/api/fincas/${fincaId}/cosechas`, opcionesCredenciales)
      .pipe(map((cosechas) => cosechas.map(cosechaDesdeApi)));
  }

  private sincronizarDashboard(cosecha: Cosecha): void {
    this.dashboard.sincronizarCosechaReciente({
      id: cosecha.id,
      variedad: cosecha.variedad,
      finca: cosecha.fincaNombre ?? '',
      proceso: cosecha.proceso,
      kgDisponibles: cosecha.kgDisponibles,
      estado: cosecha.estado,
    });
  }
}
