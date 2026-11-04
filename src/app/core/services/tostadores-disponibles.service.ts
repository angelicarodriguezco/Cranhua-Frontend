import { Injectable, signal } from '@angular/core';

import { TOSTADORES_DISPONIBLES } from '../mocks/tostadores-disponibles.mock';
import { FiltrosTostadores, TostadorDisponible } from '../models/tostador-disponible.model';

export function filtrarTostadores(
  tostadores: TostadorDisponible[],
  filtros: FiltrosTostadores,
): TostadorDisponible[] {
  return tostadores.filter(
    (t) =>
      (!filtros.estilo || t.estilos.includes(filtros.estilo)) &&
      (!filtros.soloConCafe || t.kgDisponibles > 0),
  );
}

@Injectable({ providedIn: 'root' })
export class TostadoresDisponiblesService {
  private readonly lista = signal<TostadorDisponible[]>(TOSTADORES_DISPONIBLES);

  readonly tostadores = this.lista.asReadonly();
}
