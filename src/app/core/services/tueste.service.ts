import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { TOSTADOR_ACTUAL } from '../mocks/negocio-tueste.mock';
import { LOTES_COMPRADOS, TUESTES_REGISTRADOS } from '../mocks/tueste.mock';
import { LoteComprado, NuevoTueste, Tueste } from '../models/tueste.model';
import { iniciales } from '../../shared/utils/formato';

/** Porcentaje de peso que pierde el café al tostarse; null si los pesos no alcanzan para calcularlo. */
export function calcularMerma(
  pesoVerdeKg: number | null,
  pesoTostadoKg: number | null,
): number | null {
  if (!pesoVerdeKg || pesoVerdeKg <= 0 || pesoTostadoKg == null) {
    return null;
  }
  if (pesoTostadoKg < 0 || pesoTostadoKg > pesoVerdeKg) {
    return null;
  }
  return ((pesoVerdeKg - pesoTostadoKg) / pesoVerdeKg) * 100;
}

// Simula el backend con datos en memoria; las firmas devuelven Observable para cambiarlo por HTTP
@Injectable({ providedIn: 'root' })
export class TuesteService {
  private lotes = LOTES_COMPRADOS.map((l) => ({ ...l }));
  private tuestes = TUESTES_REGISTRADOS.map((t) => ({ ...t }));

  lotesComprados(): Observable<LoteComprado[]> {
    return of(this.lotes);
  }

  tuestesDelLote(loteId: string): Observable<Tueste[]> {
    return of(this.tuestes.filter((t) => t.loteId === loteId));
  }

  // Número del lote más las iniciales del tostador, por ejemplo TRZ-0101-MC. Si el lote ya
  // tiene código se devuelve el mismo: puede estar impreso.
  generarCodigo(loteId: string): Observable<LoteComprado> {
    const actual = this.lotes.find((l) => l.id === loteId)!;
    if (actual.codigoTrazabilidad) {
      return of(actual);
    }
    const numero = actual.codigoLote.split('-').at(-1);
    const lote = { ...actual, codigoTrazabilidad: `TRZ-${numero}-${iniciales(TOSTADOR_ACTUAL)}` };
    this.lotes = this.lotes.map((l) => (l.id === loteId ? lote : l));
    return of(lote);
  }

  obtener(id: string): Observable<Tueste | null> {
    return of(this.tuestes.find((t) => t.id === id) ?? null);
  }

  registrar(nuevo: NuevoTueste): Observable<Tueste> {
    const tueste: Tueste = {
      ...nuevo,
      id: `tu-${Date.now()}`,
      codigoTrazabilidad: this.siguienteCodigo(nuevo.loteId),
    };
    this.tuestes.push(tueste);
    return of(tueste);
  }

  // El lote y el código no cambian al editar: el código ya puede estar impreso en las bolsas
  actualizar(id: string, cambios: Omit<NuevoTueste, 'loteId'>): Observable<Tueste> {
    const actual = this.tuestes.find((t) => t.id === id)!;
    const tueste = { ...actual, ...cambios };
    this.tuestes = this.tuestes.map((t) => (t.id === id ? tueste : t));
    return of(tueste);
  }

  // Código del lote más un correlativo por tueste, por ejemplo CRH-2026-0101-T02
  private siguienteCodigo(loteId: string): string {
    const lote = this.lotes.find((l) => l.id === loteId)!;
    const numero = this.tuestes.filter((t) => t.loteId === loteId).length + 1;
    return `${lote.codigoLote}-T${String(numero).padStart(2, '0')}`;
  }
}
