import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { COSECHAS_REGISTRADAS } from '../mocks/cosecha.mock';
import { Cosecha } from '../models/cosecha.model';

// Simula el backend con datos en memoria; las firmas devuelven Observable para cambiarlo por HTTP
@Injectable({ providedIn: 'root' })
export class CosechaService {
  private readonly cosechas = [...COSECHAS_REGISTRADAS];

  deFinca(fincaId: string): Observable<Cosecha[]> {
    return of(this.cosechas.filter((c) => c.fincaId === fincaId));
  }
}
