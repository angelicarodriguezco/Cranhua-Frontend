import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { PERFILES_FINCA_PUBLICO } from '../mocks/perfil-finca-publico.mock';
import { PerfilFincaPublico } from '../models/perfil-finca-publico.model';

@Injectable({ providedIn: 'root' })
export class PerfilFincaPublicoService {
  obtener(id: string): Observable<PerfilFincaPublico | undefined> {
    return of(PERFILES_FINCA_PUBLICO.find((f) => f.id === id));
  }
}
