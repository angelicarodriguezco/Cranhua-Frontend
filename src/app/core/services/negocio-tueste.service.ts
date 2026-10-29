import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { CANTONES } from '../mocks/negocio-tueste.mock';
import {
  Canton,
  Coordenada,
  NegocioTueste,
  NuevoNegocioTueste,
} from '../models/negocio-tueste.model';

// Más lejos que esto de la cabecera más cercana se considera fuera de los cantones de ejemplo
const DISTANCIA_MAXIMA_CANTON_KM = 25;

const RADIO_TIERRA_KM = 6371;

const aRadianes = (grados: number) => (grados * Math.PI) / 180;

function distanciaKm(a: Coordenada, b: Coordenada): number {
  const x = aRadianes(b.lng - a.lng) * Math.cos(aRadianes((a.lat + b.lat) / 2));
  const y = aRadianes(b.lat - a.lat);
  return Math.hypot(x, y) * RADIO_TIERRA_KM;
}

// Simula el backend con datos en memoria; las firmas devuelven Observable para cambiarlo por HTTP
@Injectable({ providedIn: 'root' })
export class NegocioTuesteService {
  private negocios: NegocioTueste[] = [];

  registrar(nuevo: NuevoNegocioTueste): Observable<NegocioTueste> {
    const negocio = { ...nuevo, id: `t-${Date.now()}` };
    this.negocios.push(negocio);
    return of(negocio);
  }

  actualizar(negocio: NegocioTueste): Observable<NegocioTueste> {
    this.negocios = this.negocios.map((n) => (n.id === negocio.id ? negocio : n));
    return of(negocio);
  }

  cantonDe(punto: Coordenada): Canton | null {
    let masCercano: Canton | null = null;
    let menorDistancia = DISTANCIA_MAXIMA_CANTON_KM;
    for (const canton of CANTONES) {
      const distancia = distanciaKm(punto, canton.cabecera);
      if (distancia < menorDistancia) {
        masCercano = canton;
        menorDistancia = distancia;
      }
    }
    return masCercano;
  }
}
