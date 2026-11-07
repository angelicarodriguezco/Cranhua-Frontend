import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { SesionService } from '../../core/services/sesion.service';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

@Component({
  selector: 'app-dashboard-cafetalero',
  imports: [MenuLateralComponent, RouterLink],
  templateUrl: './dashboard-cafetalero.component.html',
  styleUrl: './dashboard-cafetalero.component.css',
})
export class DashboardCafetaleroComponent {
  private readonly dashboard = inject(DashboardCafetaleroService);
  private readonly sesion = inject(SesionService);

  protected readonly usuario = this.sesion.usuario;
  protected readonly tema = this.dashboard.tema;
  protected readonly indicadores = this.dashboard.indicadores;
  protected readonly solicitudes = this.dashboard.solicitudesPendientes;
  protected readonly fincas = this.dashboard.fincasResumen;
  protected readonly cosechas = this.dashboard.cosechasRecientes;

  protected aprobar(id: string): void {
    this.dashboard.aprobarSolicitud(id);
  }

  protected rechazar(id: string): void {
    this.dashboard.rechazarSolicitud(id);
  }
}
