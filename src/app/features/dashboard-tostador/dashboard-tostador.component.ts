import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { ExploradorCosechasComponent } from '../../shared/components/explorador-cosechas/explorador-cosechas.component';
import { MenuLateralTostadorComponent } from './components/menu-lateral-tostador/menu-lateral-tostador.component';

@Component({
  selector: 'app-dashboard-tostador',
  imports: [ExploradorCosechasComponent, MenuLateralTostadorComponent, RouterLink],
  templateUrl: './dashboard-tostador.component.html',
  styleUrl: './dashboard-tostador.component.css',
})
export class DashboardTostadorComponent {
  private readonly dashboard = inject(DashboardTostadorService);

  protected readonly tostador = this.dashboard.tostador;
  protected readonly perfilSidebar = this.dashboard.perfilSidebar;
  protected readonly indicadores = this.dashboard.indicadores;
  protected readonly tema = this.dashboard.tema;

  protected alternarTema(): void {
    this.dashboard.alternarTema();
  }
}
