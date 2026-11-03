import { Component, inject } from '@angular/core';

import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { ExploradorCosechasComponent } from '../../shared/components/explorador-cosechas/explorador-cosechas.component';
import { MenuLateralTostadorComponent } from '../dashboard-tostador/components/menu-lateral-tostador/menu-lateral-tostador.component';

// Mismo fondo, vidrio y temas que el dashboard del tostador
@Component({
  selector: 'app-explorar-cosechas',
  imports: [ExploradorCosechasComponent, MenuLateralTostadorComponent],
  templateUrl: './explorar-cosechas.component.html',
  styleUrl: '../dashboard-tostador/dashboard-tostador.component.css',
})
export class ExplorarCosechasComponent {
  private readonly dashboard = inject(DashboardTostadorService);

  protected readonly perfilSidebar = this.dashboard.perfilSidebar;
  protected readonly tema = this.dashboard.tema;

  protected alternarTema(): void {
    this.dashboard.alternarTema();
  }
}
