import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { CAFETERIA_ACTUAL, CAFETERIA_EJEMPLO, CANTONES_URBANOS } from '../mocks/cafeteria.mock';
import { CANTONES } from '../mocks/finca.mock';
import { Cafeteria, CantonReferencia, NuevaCafeteria } from '../models/cafeteria.model';
import { Coordenada } from '../models/finca.model';
import { distanciaKm } from '../../shared/utils/geo';

const DISTANCIA_MAXIMA_CANTON_KM = 25;

const CANTONES_CAFETERIA: CantonReferencia[] = [...CANTONES_URBANOS, ...CANTONES];

@Injectable({ providedIn: 'root' })
export class CafeteriaService {
  private cafeterias: Cafeteria[] = [
    { ...CAFETERIA_EJEMPLO, estilos: [...CAFETERIA_EJEMPLO.estilos] },
  ];

  registrar(nueva: NuevaCafeteria): Observable<Cafeteria> {
    const cafeteria = { ...nueva, id: `c-${Date.now()}` };
    this.cafeterias.push(cafeteria);
    return of(cafeteria);
  }

  actualizar(cafeteria: Cafeteria): Observable<Cafeteria> {
    this.cafeterias = this.cafeterias.map((c) => (c.id === cafeteria.id ? cafeteria : c));
    return of(cafeteria);
  }

  obtenerPorPropietario(propietarioId: string): Observable<Cafeteria | undefined> {
    return of(this.cafeterias.find((c) => c.propietarioId === propietarioId));
  }

  obtenerActual(): Observable<Cafeteria | undefined> {
    return this.obtenerPorPropietario(CAFETERIA_ACTUAL.id);
  }

  registrarActual(nueva: Omit<NuevaCafeteria, 'propietarioId'>): Observable<Cafeteria> {
    return this.registrar({ ...nueva, propietarioId: CAFETERIA_ACTUAL.id });
  }

  eliminar(id: string): Observable<boolean> {
    const existia = this.cafeterias.some((c) => c.id === id);
    if (!existia) {
      return of(false);
    }
    this.cafeterias = this.cafeterias.filter((c) => c.id !== id);
    return of(true);
  }

  cantonDe(punto: Coordenada): CantonReferencia | null {
    let masCercano: CantonReferencia | null = null;
    let menorDistancia = DISTANCIA_MAXIMA_CANTON_KM;
    for (const canton of CANTONES_CAFETERIA) {
      const distancia = distanciaKm(punto, canton.cabecera);
      if (distancia < menorDistancia) {
        masCercano = canton;
        menorDistancia = distancia;
      }
    }
    return masCercano;
  }
}
