import { Component, inject } from '@angular/core';

import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { formatearFecha, formatearKg } from '../../shared/utils/formato';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

@Component({
  selector: 'app-dashboard-cafeteria',
  imports: [MenuLateralComponent],
  templateUrl: './dashboard-cafeteria.component.html',
  styleUrl: './dashboard-cafeteria.component.css',
})
export class DashboardCafeteriaComponent {
  private readonly dashboard = inject(DashboardCafeteriaService);

  protected readonly tema = this.dashboard.tema;
  protected readonly indicadores = this.dashboard.indicadores;
  protected readonly pedidos = this.dashboard.pedidosRecientes;

  protected readonly fecha = formatearFecha;
  protected readonly kg = formatearKg;
}
