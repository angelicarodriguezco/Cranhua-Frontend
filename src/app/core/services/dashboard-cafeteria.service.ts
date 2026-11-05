import { Injectable, inject } from '@angular/core';

import { RESUMEN_DASHBOARD_CAFETERIA } from '../mocks/dashboard-cafeteria.mock';
import { IndicadoresCafeteria, PedidoRecienteCafeteria } from '../models/dashboard-cafeteria.model';
import { PerfilCafeteriaSidebar } from '../models/pedido.model';

import { TemaService } from './tema.service';

@Injectable({ providedIn: 'root' })
export class DashboardCafeteriaService {
  private readonly temas = inject(TemaService);

  readonly indicadores: IndicadoresCafeteria = RESUMEN_DASHBOARD_CAFETERIA.indicadores;
  readonly pedidosRecientes: PedidoRecienteCafeteria[] =
    RESUMEN_DASHBOARD_CAFETERIA.pedidosRecientes;
  readonly perfilSidebar: PerfilCafeteriaSidebar = RESUMEN_DASHBOARD_CAFETERIA.perfilSidebar;
  readonly tema = this.temas.tema;

  alternarTema(): void {
    this.temas.alternarTema();
  }
}
