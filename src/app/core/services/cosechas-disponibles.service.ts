import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { cosechaDisponibleDesdeApi } from '../mappers/cosecha-disponible.mapper';
import {
  CosechaDisponible,
  CosechaDisponibleApi,
  FiltrosCosechas,
  RANGOS_PRECIO_COSECHA,
} from '../models/cosecha-disponible.model';
import { ZonaCafetalera } from '../models/finca.model';

export interface FiltrosCosechasServidor {
  zona?: ZonaCafetalera | null;
  florales?: boolean;
  honey?: boolean;
}

export function filtrarCosechas(
  cosechas: CosechaDisponible[],
  filtros: Pick<FiltrosCosechas, 'soloDisponibles' | 'variedad' | 'rangoPrecio'>,
): CosechaDisponible[] {
  const rango = filtros.rangoPrecio ? RANGOS_PRECIO_COSECHA[filtros.rangoPrecio] : null;

  return cosechas.filter(
    (c) =>
      (!filtros.soloDisponibles || c.disponibilidad === 'Disponible') &&
      (!filtros.variedad || c.variedad === filtros.variedad) &&
      (!rango || (c.precioDesdeKg >= rango.min && c.precioDesdeKg <= rango.max)),
  );
}

function paramsDesdeFiltros(filtros: FiltrosCosechasServidor): HttpParams {
  let params = new HttpParams();
  if (filtros.zona) {
    params = params.set('zona', filtros.zona);
  }
  if (filtros.florales) {
    params = params.set('florales', 'true');
  }
  if (filtros.honey) {
    params = params.set('honey', 'true');
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class CosechasDisponiblesService {
  private readonly http = inject(HttpClient);

  private get base(): string {
    return `${environment.apiUrl}/api/cosechas/disponibles`;
  }

  listar(filtros: FiltrosCosechasServidor = {}): Observable<CosechaDisponible[]> {
    return this.http
      .get<CosechaDisponibleApi[]>(this.base, {
        withCredentials: true,
        params: paramsDesdeFiltros(filtros),
      })
      .pipe(map((lista) => lista.map(cosechaDisponibleDesdeApi)));
  }
}
