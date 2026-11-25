import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { tostadorDisponibleDesdeApi } from '../mappers/tostador-exploracion.mapper';
import { nivelTuesteHaciaApi } from '../mappers/tueste.mapper';
import {
  FiltrosTostadores,
  SIN_FILTROS,
  TostadorDisponible,
  TostadorExploracionApi,
} from '../models/tostador-disponible.model';

function paramsDesdeFiltros(filtros: FiltrosTostadores): HttpParams {
  let params = new HttpParams();
  if (filtros.estilo) {
    params = params.set('estilo', nivelTuesteHaciaApi(filtros.estilo));
  }
  if (filtros.soloConCafe) {
    params = params.set('disponible', 'true');
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class TostadoresDisponiblesService {
  private readonly http = inject(HttpClient);

  private get base(): string {
    return `${environment.apiUrl}/api/tostadores`;
  }

  listar(filtros: FiltrosTostadores = SIN_FILTROS): Observable<TostadorDisponible[]> {
    return this.http
      .get<TostadorExploracionApi[]>(this.base, {
        withCredentials: true,
        params: paramsDesdeFiltros(filtros),
      })
      .pipe(map((lista) => lista.map(tostadorDisponibleDesdeApi)));
  }
}
