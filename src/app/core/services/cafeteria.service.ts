import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { CANTONES_URBANOS } from '../mocks/cafeteria.mock';
import { CANTONES } from '../mocks/finca.mock';
import { Cafeteria, CantonReferencia, NuevaCafeteria } from '../models/cafeteria.model';
import { Coordenada } from '../models/finca.model';
import { distanciaKm } from '../../shared/utils/geo';

// Más lejos que esto de la cabecera más cercana se considera fuera de los cantones de ejemplo
const DISTANCIA_MAXIMA_CANTON_KM = 25;

const CANTONES_CAFETERIA: CantonReferencia[] = [...CANTONES_URBANOS, ...CANTONES];

// Simula el backend con datos en memoria; las firmas devuelven Observable para cambiarlo por HTTP
@Injectable({ providedIn: 'root' })
export class CafeteriaService {
  private cafeterias: Cafeteria[] = [];

  registrar(nueva: NuevaCafeteria): Observable<Cafeteria> {
    const cafeteria = { ...nueva, id: `c-${Date.now()}` };
    this.cafeterias.push(cafeteria);
    return of(cafeteria);
  }

  actualizar(id: string, datos: NuevaCafeteria): Observable<Cafeteria> {
    const cafeteria = { ...datos, id };
    this.cafeterias = this.cafeterias.map((c) => (c.id === id ? cafeteria : c));
    return of(cafeteria);
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
