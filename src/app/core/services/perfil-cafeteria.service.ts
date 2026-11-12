import { Injectable } from '@angular/core';

import { PERFILES_CAFETERIA } from '../mocks/perfil-cafeteria.mock';
import { PerfilCafeteria } from '../models/perfil-cafeteria.model';

@Injectable({ providedIn: 'root' })
export class PerfilCafeteriaService {
  obtener(id: string): PerfilCafeteria | null {
    return PERFILES_CAFETERIA.find((perfil) => perfil.id === id) ?? null;
  }
}
