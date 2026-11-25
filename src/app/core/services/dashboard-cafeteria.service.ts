import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { resumenDashboardCafeteriaDesdeApi } from '../mappers/pedido.mapper';
import {
  DashboardCafeteriaApi,
  ResumenDashboardCafeteria,
} from '../models/dashboard-cafeteria.model';

import { CafeteriaService } from './cafeteria.service';
import { TemaService } from './tema.service';

@Injectable({ providedIn: 'root' })
export class DashboardCafeteriaService {
  private readonly http = inject(HttpClient);
  private readonly cafeterias = inject(CafeteriaService);
  private readonly temas = inject(TemaService);

  readonly tema = this.temas.tema;

  obtenerResumen(): Observable<ResumenDashboardCafeteria> {
    return this.cafeterias.obtenerActual().pipe(
      switchMap((cafeteria) =>
        cafeteria
          ? this.http.get<DashboardCafeteriaApi>(
              `${environment.apiUrl}/api/cafeterias/${cafeteria.id}/dashboard`,
              { withCredentials: true },
            )
          : throwError(() => new Error('La cuenta no tiene una cafetería registrada.')),
      ),
      map(resumenDashboardCafeteriaDesdeApi),
    );
  }

  alternarTema(): void {
    this.temas.alternarTema();
  }
}
