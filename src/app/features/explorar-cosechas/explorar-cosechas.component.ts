import { Component, inject } from '@angular/core';

import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { ExploradorCosechasComponent } from '../../shared/components/explorador-cosechas/explorador-cosechas.component';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

// Mismo fondo, vidrio y temas que el dashboard del tostador
@Component({
  selector: 'app-explorar-cosechas',
  imports: [ExploradorCosechasComponent, MenuLateralComponent],
  templateUrl: './explorar-cosechas.component.html',
  styleUrl: '../dashboard-tostador/dashboard-tostador.component.css',
})
export class ExplorarCosechasComponent {
  private readonly dashboard = inject(DashboardTostadorService);

  protected readonly tema = this.dashboard.tema;
}
