import { Injectable, signal } from '@angular/core';

import { COSECHAS_DISPONIBLES } from '../mocks/cosechas-disponibles.mock';
import {
  CosechaDisponible,
  FiltrosCosechas,
  NOTAS_FLORALES,
  RANGOS_PRECIO_COSECHA,
} from '../models/cosecha-disponible.model';

export function filtrarCosechas(
  cosechas: CosechaDisponible[],
  filtros: FiltrosCosechas,
): CosechaDisponible[] {
  const rango = filtros.rangoPrecio ? RANGOS_PRECIO_COSECHA[filtros.rangoPrecio] : null;

  return cosechas.filter(
    (c) =>
      (!filtros.soloDisponibles || c.disponibilidad === 'Disponible') &&
      (!filtros.zona || c.zona === filtros.zona) &&
      (!filtros.variedad || c.variedad === filtros.variedad) &&
      (!rango || (c.precioDesdeKg >= rango.min && c.precioDesdeKg <= rango.max)) &&
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
