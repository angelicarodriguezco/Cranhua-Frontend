import { Injectable, signal } from '@angular/core';

import { RESUMEN_DASHBOARD_CAFETERIA } from '../mocks/dashboard-cafeteria.mock';
import {
  IndicadoresCafeteria,
  PedidoRecienteCafeteria,
  PerfilCafeteriaSidebar,
  ResumenDashboardCafeteria,
} from '../models/dashboard-cafeteria.model';
import { TemaDashboard } from '../models/dashboard-cafetalero.model';

@Injectable({ providedIn: 'root' })
export class DashboardCafeteriaService {
  private readonly temaActual = signal<TemaDashboard>('oscuro');

  readonly resumen: ResumenDashboardCafeteria = RESUMEN_DASHBOARD_CAFETERIA;
  readonly indicadores: IndicadoresCafeteria = RESUMEN_DASHBOARD_CAFETERIA.indicadores;
  readonly pedidosRecientes: PedidoRecienteCafeteria[] =
    RESUMEN_DASHBOARD_CAFETERIA.pedidosRecientes;
  readonly perfilSidebar: PerfilCafeteriaSidebar = RESUMEN_DASHBOARD_CAFETERIA.perfilSidebar;
  readonly tema = this.temaActual.asReadonly();

  alternarTema(): void {
    this.temaActual.update((actual) => (actual === 'oscuro' ? 'claro' : 'oscuro'));
  }
}
