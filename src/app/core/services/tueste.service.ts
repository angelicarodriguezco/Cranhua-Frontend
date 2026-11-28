import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  cuerpoActualizarTueste,
  cuerpoRegistrarTueste,
  loteCompradoDesdeFicha,
  lotesCompradosDesdeApi,
  tuesteDesdeApi,
} from '../mappers/tueste.mapper';
import {
  CodigoGenerado,
  ErrorTueste,
  FichaCodigoApi,
  LoteComprado,
  LoteConKgPorTostar,
  LotesComprados,
  LotesCompradosResponseApi,
  NuevoTueste,
  Tueste,
  TuesteApi,
} from '../models/tueste.model';

export function calcularMerma(
  pesoVerdeKg: number | null,
  pesoTostadoKg: number | null,
): number | null {
  if (!pesoVerdeKg || pesoVerdeKg <= 0 || pesoTostadoKg == null) {
    return null;
  }
  if (pesoTostadoKg < 0 || pesoTostadoKg > pesoVerdeKg) {
    return null;
  }
  return ((pesoVerdeKg - pesoTostadoKg) / pesoVerdeKg) * 100;
}

export function kgPorTostar(
  lote: Pick<LoteComprado, 'kg'>,
  tuestes: Pick<Tueste, 'pesoVerdeKg'>[],
): number {
  const usados = tuestes.reduce((total, t) => total + t.pesoVerdeKg, 0);
  return lote.kg - usados;
}

const opcionesCredenciales = { withCredentials: true as const };

const ERROR_TUESTE = 'No pudimos guardar el tueste. Intentá de nuevo.';

@Injectable({ providedIn: 'root' })
export class TuesteService {
  private readonly http = inject(HttpClient);

  private get baseLotes(): string {
    return `${environment.apiUrl}/api/lotes`;
  }

  private get baseTuestes(): string {
    return `${environment.apiUrl}/api/tuestes`;
  }

  lotesComprados(): Observable<LotesComprados> {
    return this.http
      .get<LotesCompradosResponseApi>(this.baseLotes, opcionesCredenciales)
      .pipe(map(lotesCompradosDesdeApi));
  }

  generarCodigo(
    loteId: string,
    base?: Pick<LoteComprado, 'fechaCompra' | 'proceso'>,
  ): Observable<CodigoGenerado> {
    return this.http
      .post<FichaCodigoApi>(`${this.baseLotes}/${loteId}/codigo`, {}, opcionesCredenciales)
      .pipe(
        map((ficha) => ({
          lote: loteCompradoDesdeFicha(ficha, base),
          tostador: ficha.tostador,
        })),
      );
  }

  tuestesDelLote(loteId: string): Observable<Tueste[]> {
    return this.http
      .get<TuesteApi[]>(`${this.baseLotes}/${loteId}/tuestes`, opcionesCredenciales)
      .pipe(map((tuestes) => tuestes.map((t) => tuesteDesdeApi(t))));
  }

  // No hay GET /api/tuestes/{id}: se busca entre los tuestes de cada lote del tostador.
  // El lote trae los kg por tostar sin contar este tueste, para validar la edición.
  obtener(id: string): Observable<{ tueste: Tueste; lote: LoteConKgPorTostar } | null> {
    return this.lotesConTuestes().pipe(
      map((lotes) => {
        for (const { lote, tuestes } of lotes) {
          const tueste = tuestes.find((t) => t.id === id);
          if (tueste) {
            const otros = tuestes.filter((t) => t.id !== id);
            return { tueste, lote: { ...lote, kgPorTostar: kgPorTostar(lote, otros) } };
          }
        }
        return null;
      }),
    );
  }

  registrar(nuevo: NuevoTueste): Observable<Tueste> {
    return this.http
      .post<TuesteApi>(this.baseTuestes, cuerpoRegistrarTueste(nuevo), opcionesCredenciales)
      .pipe(
        map((api) => tuesteDesdeApi(api)),
        catchError((error: HttpErrorResponse) => throwError(() => this.errorTueste(error))),
      );
  }

  actualizar(id: string, cambios: Omit<NuevoTueste, 'loteId'>): Observable<Tueste> {
    return this.http
      .patch<TuesteApi>(
        `${this.baseTuestes}/${id}`,
        cuerpoActualizarTueste(cambios),
        opcionesCredenciales,
      )
      .pipe(
        map((api) => tuesteDesdeApi(api)),
        catchError((error: HttpErrorResponse) => throwError(() => this.errorTueste(error))),
      );
  }

  lotesConKgPorTostar(): Observable<LoteConKgPorTostar[]> {
    return this.lotesConTuestes().pipe(
      map((lotes) =>
        lotes
          .map(({ lote, tuestes }) => ({ ...lote, kgPorTostar: kgPorTostar(lote, tuestes) }))
          .filter((lote) => lote.kgPorTostar > 0),
      ),
    );
  }

  private lotesConTuestes(): Observable<{ lote: LoteComprado; tuestes: Tueste[] }[]> {
    return this.lotesComprados().pipe(
      switchMap(({ lotes }) =>
        lotes.length === 0
          ? of([])
          : forkJoin(
              lotes.map((lote) =>
                this.tuestesDelLote(lote.id).pipe(map((tuestes) => ({ lote, tuestes }))),
              ),
            ),
      ),
    );
  }

  // 400: errores por campo; 409: el backend rechaza el cambio por pedidos de cafeterías
  private errorTueste(error: HttpErrorResponse): ErrorTueste {
    if (error.status === 400 || error.status === 409) {
      return {
        mensaje: error.error?.mensaje ?? ERROR_TUESTE,
        errores: error.error?.errores ?? {},
      };
    }
    return { mensaje: ERROR_TUESTE, errores: {} };
  }
}
