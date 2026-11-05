import { Injectable, inject } from '@angular/core';

import {
  CODIGOS_TRAZABILIDAD_CONSUMIDOR,
  PUNTOS_MAPA_CONSUMIDOR,
} from '../mocks/dashboard-consumidor.mock';
import { TemaDashboard } from '../models/dashboard-cafetalero.model';
import {
  CodigoTrazabilidadConsumidor,
  PuntoMapaConsumidor,
} from '../models/punto-mapa-consumidor.model';

import { TemaService } from './tema.service';

@Injectable({ providedIn: 'root' })
export class DashboardConsumidorService {
  private readonly temas = inject(TemaService);

  readonly tema = this.temas.tema;

  puntos(): PuntoMapaConsumidor[] {
    return PUNTOS_MAPA_CONSUMIDOR;
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
