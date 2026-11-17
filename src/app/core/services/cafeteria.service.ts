import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Cafeteria, CafeteriaResponseApi, NuevaCafeteria } from '../models/cafeteria.model';
import { cafeteriaDesdeApi, cuerpoRegistro } from '../utils/cafeteria-desde-api';

const opcionesCredenciales = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class CafeteriaService {
  private readonly http = inject(HttpClient);
  private actual$: Observable<Cafeteria | undefined> | null = null;

  private get base(): string {
    return `${environment.apiUrl}/api/cafeterias`;
  }

  registrar(nueva: NuevaCafeteria): Observable<Cafeteria> {
    const { propietarioId, ...datos } = nueva;
    void propietarioId;
    return this.crear(datos);
  }

  registrarActual(nueva: Omit<NuevaCafeteria, 'propietarioId'>): Observable<Cafeteria> {
    return this.crear(nueva);
  }

  private crear(nueva: Omit<NuevaCafeteria, 'propietarioId'>): Observable<Cafeteria> {
    return this.http
      .post<CafeteriaResponseApi>(this.base, cuerpoRegistro(nueva), opcionesCredenciales)
      .pipe(
        map(cafeteriaDesdeApi),
        tap((cafeteria) => this.guardarCache(cafeteria)),
      );
  }

  actualizar(cafeteria: Cafeteria): Observable<Cafeteria> {
    const { id, propietarioId, ...datos } = cafeteria;
    void propietarioId;
    return this.http
      .patch<CafeteriaResponseApi>(
        `${this.base}/${id}`,
        cuerpoRegistro(datos),
        opcionesCredenciales,
      )
      .pipe(
        map(cafeteriaDesdeApi),
        tap((guardada) => this.guardarCache(guardada)),
      );
  }

  obtenerActual(): Observable<Cafeteria | undefined> {
    if (!this.actual$) {
      this.actual$ = this.http
        .get<CafeteriaResponseApi>(`${this.base}/actual`, opcionesCredenciales)
        .pipe(
          map(cafeteriaDesdeApi),
          catchError((error: HttpErrorResponse) => {
            if (error.status === 404) {
              return of(undefined);
            }
            this.actual$ = null;
            return throwError(() => error);
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }
    return this.actual$;
  }

  limpiarCache(): void {
    this.actual$ = null;
  }

  private guardarCache(cafeteria: Cafeteria): void {
    this.actual$ = of(cafeteria).pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }

  eliminar(id: string): Observable<boolean> {
    void id;
    return of(false);
  }
}
