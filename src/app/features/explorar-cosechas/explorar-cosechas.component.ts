import { Component, inject } from '@angular/core';

import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { ExploradorCosechasComponent } from '../../shared/components/explorador-cosechas/explorador-cosechas.component';
import { MenuLateralTostadorComponent } from '../dashboard-tostador/components/menu-lateral-tostador/menu-lateral-tostador.component';

// Marketplace de cosechas para el tostador. Usa el fondo, el vidrio y los dos temas del dashboard.
@Component({
  selector: 'app-explorar-cosechas',
  imports: [ExploradorCosechasComponent, MenuLateralTostadorComponent],
  templateUrl: './explorar-cosechas.component.html',
  styleUrls: [
    '../dashboard-tostador/dashboard-tostador.component.css',
    './explorar-cosechas.component.css',
  ],
})
export class ExplorarCosechasComponent {
  // El tema y el perfil del menú se comparten con el dashboard del tostador
  private readonly dashboard = inject(DashboardTostadorService);

  protected readonly perfilSidebar = this.dashboard.perfilSidebar;
  protected readonly tema = this.dashboard.tema;

  protected alternarTema(): void {
    this.dashboard.alternarTema();
  }
}
