import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { ExploradorCosechasComponent } from '../../shared/components/explorador-cosechas/explorador-cosechas.component';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

@Component({
  selector: 'app-dashboard-tostador',
  imports: [ExploradorCosechasComponent, MenuLateralComponent, RouterLink],
  templateUrl: './dashboard-tostador.component.html',
  styleUrl: './dashboard-tostador.component.css',
})
export class DashboardTostadorComponent {
  private readonly dashboard = inject(DashboardTostadorService);

  protected readonly tostador = this.dashboard.tostador;
  protected readonly indicadores = this.dashboard.indicadores;
  protected readonly tema = this.dashboard.tema;
}
