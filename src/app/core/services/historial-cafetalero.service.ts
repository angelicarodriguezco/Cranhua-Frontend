import { Injectable, computed, signal } from '@angular/core';

import { COSECHAS_HISTORIAL, LOTES_VENDIDOS } from '../mocks/historial-cafetalero.mock';
import {
  CosechaHistorial,
  IndicadoresHistorial,
  LoteVendido,
} from '../models/historial-cafetalero.model';

// Fechas ISO (AAAA-MM-DD): el orden alfabético es el cronológico
const masRecientePrimero = (a: string, b: string) => b.localeCompare(a);

// Simula el backend con datos en memoria
@Injectable({ providedIn: 'root' })
export class HistorialCafetaleroService {
  private readonly cosechasRegistradas = signal<CosechaHistorial[]>(
    COSECHAS_HISTORIAL.map((c) => ({ ...c })),
  );
  private readonly lotes = signal<LoteVendido[]>(LOTES_VENDIDOS.map((l) => ({ ...l })));

  readonly cosechas = computed(() =>
    [...this.cosechasRegistradas()].sort((a, b) => masRecientePrimero(a.fecha, b.fecha)),
  );
  readonly lotesVendidos = computed(() =>
    [...this.lotes()].sort((a, b) => masRecientePrimero(a.fechaVenta, b.fechaVenta)),
  );
  readonly indicadores = computed<IndicadoresHistorial>(() => ({
    cosechasRegistradas: this.cosechasRegistradas().length,
    produccionTotalKg: this.cosechasRegistradas().reduce((total, c) => total + c.kilos, 0),
    lotesVendidos: this.lotes().length,
  }));
}
