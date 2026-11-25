import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  IndicadoresCafeteria,
  PedidoRecienteCafeteria,
} from '../../core/models/dashboard-cafeteria.model';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { parsearErrorAuth } from '../../core/utils/auth-error';
import { formatearFecha, formatearKg } from '../../shared/utils/formato';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

const INDICADORES_VACIOS: IndicadoresCafeteria = {
  cafeRecibidoKg: 0,
  pedidosActivos: 0,
  tostadoresActivos: 0,
};

@Component({
  selector: 'app-dashboard-cafeteria',
  imports: [MenuLateralComponent, RouterLink],
  templateUrl: './dashboard-cafeteria.component.html',
  styleUrl: './dashboard-cafeteria.component.css',
})
export class DashboardCafeteriaComponent {
  private readonly dashboard = inject(DashboardCafeteriaService);

  protected readonly tema = this.dashboard.tema;
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly indicadores = signal<IndicadoresCafeteria>(INDICADORES_VACIOS);
  protected readonly pedidos = signal<PedidoRecienteCafeteria[]>([]);

  protected readonly fecha = formatearFecha;
  protected readonly kg = formatearKg;

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.dashboard.obtenerResumen().subscribe({
      next: ({ indicadores, pedidosRecientes }) => {
        this.indicadores.set(indicadores);
        this.pedidos.set(pedidosRecientes);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.error.set(parsearErrorAuth(err).mensaje);
        this.cargando.set(false);
      },
    });
  }
}
