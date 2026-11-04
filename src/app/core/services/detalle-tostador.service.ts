import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { DETALLES_TOSTADOR } from '../mocks/detalle-tostador.mock';
import { DetalleTostador } from '../models/detalle-tostador.model';

@Injectable({ providedIn: 'root' })
export class DetalleTostadorService {
  obtener(id: string): Observable<DetalleTostador | undefined> {
    return of(DETALLES_TOSTADOR.find((t) => t.id === id));
  }
}
