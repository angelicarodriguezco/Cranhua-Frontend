import { Injectable } from '@angular/core';

import { PERFILES_TOSTADOR } from '../mocks/perfil-tostador.mock';
import { PerfilTostador } from '../models/perfil-tostador.model';

@Injectable({ providedIn: 'root' })
export class PerfilTostadorService {
  obtener(id: string): PerfilTostador | null {
    return PERFILES_TOSTADOR.find((perfil) => perfil.id === id) ?? null;
  }
}
