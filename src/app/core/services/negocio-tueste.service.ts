import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';

import { CANTONES, NEGOCIO_EJEMPLO } from '../mocks/negocio-tueste.mock';
import {
  Canton,
  Coordenada,
  NegocioTueste,
  NuevoNegocioTueste,
} from '../models/negocio-tueste.model';
import { SesionService } from './sesion.service';

const DISTANCIA_MAXIMA_CANTON_KM = 25;

const RADIO_TIERRA_KM = 6371;

const aRadianes = (grados: number) => (grados * Math.PI) / 180;

function distanciaKm(a: Coordenada, b: Coordenada): number {
  const x = aRadianes(b.lng - a.lng) * Math.cos(aRadianes((a.lat + b.lat) / 2));
  const y = aRadianes(b.lat - a.lat);
  return Math.hypot(x, y) * RADIO_TIERRA_KM;
}

@Injectable({ providedIn: 'root' })
export class NegocioTuesteService {
  private readonly sesion = inject(SesionService);
  private negocios: NegocioTueste[] = [
    { ...NEGOCIO_EJEMPLO, estilos: [...NEGOCIO_EJEMPLO.estilos] },
  ];

  registrar(nuevo: NuevoNegocioTueste): Observable<NegocioTueste> {
    const negocio = { ...nuevo, id: `t-${Date.now()}` };
    this.negocios.push(negocio);
    return of(negocio);
  }

  actualizar(negocio: NegocioTueste): Observable<NegocioTueste> {
    this.negocios = this.negocios.map((n) => (n.id === negocio.id ? negocio : n));
    return of(negocio);
  }

  obtenerPorPropietario(propietarioId: string): Observable<NegocioTueste | undefined> {
    return of(this.negocios.find((n) => n.propietarioId === propietarioId));
  }

  obtenerActual(): Observable<NegocioTueste | undefined> {
    const propietarioId = this.sesion.usuario()?.id;
    return propietarioId ? this.obtenerPorPropietario(propietarioId) : of(undefined);
  }

  eliminar(id: string): Observable<boolean> {
    const existia = this.negocios.some((n) => n.id === id);
    if (!existia) {
      return of(false);
    }
    this.negocios = this.negocios.filter((n) => n.id !== id);
    return of(true);
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
