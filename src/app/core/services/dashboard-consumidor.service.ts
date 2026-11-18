import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { mapearPuntoMapaResponseAConsumidor } from '../mappers/punto-mapa-consumidor.mapper';
import { CODIGOS_TRAZABILIDAD_CONSUMIDOR } from '../mocks/dashboard-consumidor.mock';
import { TemaDashboard } from '../models/dashboard-cafetalero.model';
import {
  CodigoTrazabilidadConsumidor,
  PuntoMapaConsumidor,
  PuntoMapaResponseApi,
} from '../models/punto-mapa-consumidor.model';

import { TemaService } from './tema.service';

const opcionesCredenciales = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class DashboardConsumidorService {
  private readonly http = inject(HttpClient);
  private readonly temas = inject(TemaService);

  readonly tema = this.temas.tema;

  puntos(): Observable<PuntoMapaConsumidor[]> {
    return this.http
      .get<PuntoMapaResponseApi[]>(`${environment.apiUrl}/api/publico/mapa`, opcionesCredenciales)
      .pipe(map((puntos) => puntos.map(mapearPuntoMapaResponseAConsumidor)));
  }

  buscarCodigo(codigo: string): CodigoTrazabilidadConsumidor | null {
    const normalizado = codigo.trim().toUpperCase();
    if (!normalizado) {
      return null;
    }
    return (
      CODIGOS_TRAZABILIDAD_CONSUMIDOR.find((c) => c.codigo.toUpperCase() === normalizado) ?? null
    );
  }

  establecerTema(tema: TemaDashboard): void {
    this.temas.establecerTema(tema);
  }
}
