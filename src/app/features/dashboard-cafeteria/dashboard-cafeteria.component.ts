import { Component, inject } from '@angular/core';

import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { formatearFecha, formatearKg } from '../../shared/utils/formato';
import { MenuLateralCafeteriaComponent } from './components/menu-lateral-cafeteria/menu-lateral-cafeteria.component';

@Component({
  selector: 'app-dashboard-cafeteria',
  imports: [MenuLateralCafeteriaComponent],
  templateUrl: './dashboard-cafeteria.component.html',
  styleUrl: './dashboard-cafeteria.component.css',
})
export class DashboardCafeteriaComponent {
  private readonly dashboard = inject(DashboardCafeteriaService);

  protected readonly perfilSidebar = this.dashboard.perfilSidebar;
  protected readonly tema = this.dashboard.tema;
  protected readonly indicadores = this.dashboard.indicadores;
  protected readonly pedidos = this.dashboard.pedidosRecientes;

  protected readonly fecha = formatearFecha;
  protected readonly kg = formatearKg;

  protected alternarTema(): void {
    this.dashboard.alternarTema();
  }
}
