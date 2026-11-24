import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { historialCafetaleroDesdeApi } from '../mappers/historial-cafetalero.mapper';
import {
  CosechaHistorial,
  HistorialCafetalero,
  HistorialCafetaleroResponseApi,
  IndicadoresHistorial,
  LoteVendido,
} from '../models/historial-cafetalero.model';

const opcionesCredenciales = { withCredentials: true as const };
const TAMANO_PAGINA = 50;

export interface ParamsHistorial {
  pagina?: number;
  tamano?: number;
}

@Injectable({ providedIn: 'root' })
export class HistorialCafetaleroService {
  private readonly http = inject(HttpClient);

  private readonly indicadoresSignal = signal<IndicadoresHistorial | null>(null);
  private readonly cosechasSignal = signal<CosechaHistorial[]>([]);
  private readonly lotesSignal = signal<LoteVendido[]>([]);

  private get baseHistorial(): string {
    return `${environment.apiUrl}/api/cafetalero/historial`;
  }

  readonly indicadores = this.indicadoresSignal.asReadonly();
  readonly cosechas = this.cosechasSignal.asReadonly();
  readonly lotesVendidos = this.lotesSignal.asReadonly();

  cargar(params: ParamsHistorial = {}): Observable<HistorialCafetalero> {
    let httpParams = new HttpParams().set('tamano', String(params.tamano ?? TAMANO_PAGINA));
    if (params.pagina != null) {
      httpParams = httpParams.set('pagina', String(params.pagina));
    }

    return this.http
      .get<HistorialCafetaleroResponseApi>(this.baseHistorial, {
        ...opcionesCredenciales,
        params: httpParams,
      })
      .pipe(
        map(historialCafetaleroDesdeApi),
        tap((historial) => this.aplicarHistorial(historial)),
      );
  }

  private aplicarHistorial(historial: HistorialCafetalero): void {
    this.indicadoresSignal.set(historial.indicadores);
    this.cosechasSignal.set(historial.cosechas);
    this.lotesSignal.set(historial.lotesVendidos);
  }
}
