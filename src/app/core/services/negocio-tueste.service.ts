import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';

import { NEGOCIO_EJEMPLO } from '../mocks/negocio-tueste.mock';
import { NegocioTueste, NuevoNegocioTueste } from '../models/negocio-tueste.model';
import { SesionService } from './sesion.service';

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
}
