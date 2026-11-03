import { Injectable, signal } from '@angular/core';

import { CAFETERIA_USUARIO_ACTUAL } from '../mocks/cafeteria.mock';
import { TemaDashboard } from '../models/dashboard-cafetalero.model';
import { PerfilCafeteriaSidebar } from '../models/pedido.model';
import { iniciales, nombreCorto } from '../../shared/utils/formato';

// El tema y el perfil del menú de la cafetería, compartidos entre sus vistas
@Injectable({ providedIn: 'root' })
export class DashboardCafeteriaService {
  private readonly temaActual = signal<TemaDashboard>('oscuro');

  readonly perfilSidebar: PerfilCafeteriaSidebar = {
    iniciales: iniciales(CAFETERIA_USUARIO_ACTUAL),
    nombreCompleto: nombreCorto(CAFETERIA_USUARIO_ACTUAL),
    rol: 'Cafetería',
  };
  readonly tema = this.temaActual.asReadonly();

  alternarTema(): void {
    this.temaActual.update((actual) => (actual === 'oscuro' ? 'claro' : 'oscuro'));
  }
}
