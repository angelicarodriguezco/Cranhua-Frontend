import { Injectable } from '@angular/core';

import { MENUS_PUBLICOS } from '../mocks/menu-publico.mock';
import { MenuPublico } from '../models/menu-publico.model';

@Injectable({ providedIn: 'root' })
export class MenuPublicoService {
  obtener(cafeteriaId: string): MenuPublico | null {
    return MENUS_PUBLICOS.find((menu) => menu.cafeteriaId === cafeteriaId) ?? null;
  }
}
