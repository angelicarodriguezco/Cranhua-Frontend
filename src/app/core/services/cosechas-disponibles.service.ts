import { Injectable, signal } from '@angular/core';

import { COSECHAS_DISPONIBLES } from '../mocks/cosechas-disponibles.mock';
import {
  CosechaDisponible,
  FiltrosCosechas,
  NOTAS_FLORALES,
} from '../models/cosecha-disponible.model';

export function filtrarCosechas(
  cosechas: CosechaDisponible[],
  filtros: FiltrosCosechas,
): CosechaDisponible[] {
  return cosechas.filter(
    (c) =>
      (!filtros.soloDisponibles || c.disponibilidad === 'Disponible') &&
      (!filtros.zona || c.zona === filtros.zona) &&
      (!filtros.soloFlorales || c.notas.some((nota) => NOTAS_FLORALES.includes(nota))) &&
      (!filtros.soloHoney || c.proceso === 'Honey'),
  );
}

// Cosechas que los cafetaleros tienen a la venta; la usan el dashboard del tostador y Explorar
@Injectable({ providedIn: 'root' })
export class CosechasDisponiblesService {
  private readonly lista = signal<CosechaDisponible[]>(COSECHAS_DISPONIBLES);

  readonly cosechas = this.lista.asReadonly();
}
