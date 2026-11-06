import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ESTILOS_TUESTE, EstiloTueste } from '../../core/models/negocio-tueste.model';
import { FiltrosTostadores, SIN_FILTROS } from '../../core/models/tostador-disponible.model';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import {
  filtrarTostadores,
  TostadoresDisponiblesService,
} from '../../core/services/tostadores-disponibles.service';
import { formatearKg } from '../../shared/utils/formato';
import { MenuLateralCafeteriaComponent } from '../dashboard-cafeteria/components/menu-lateral-cafeteria/menu-lateral-cafeteria.component';

@Component({
  selector: 'app-explorar-tostadores',
  imports: [MenuLateralCafeteriaComponent, RouterLink],
  templateUrl: './explorar-tostadores.component.html',
  styleUrl: './explorar-tostadores.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class ExplorarTostadoresComponent {
  private readonly panel = inject(DashboardCafeteriaService);
  private readonly tostadoresService = inject(TostadoresDisponiblesService);

  protected readonly perfilSidebar = this.panel.perfilSidebar;
  protected readonly tema = this.panel.tema;

  protected readonly estilos = ESTILOS_TUESTE;
  protected readonly filtros = signal<FiltrosTostadores>(SIN_FILTROS);
  protected readonly sinFiltros = computed(() => {
    const f = this.filtros();
    return !f.estilo && !f.soloConCafe;
  });
  protected readonly tostadores = computed(() =>
    filtrarTostadores(this.tostadoresService.tostadores(), this.filtros()),
  );
  protected readonly kg = formatearKg;

  protected limpiarFiltros(): void {
    this.filtros.set(SIN_FILTROS);
  }

  protected elegirEstilo(estilo: EstiloTueste): void {
    this.filtros.update((f) => ({
      ...f,
      estilo: f.estilo === estilo ? null : estilo,
    }));
  }

  protected alternarSoloConCafe(): void {
    this.filtros.update((f) => ({ ...f, soloConCafe: !f.soloConCafe }));
  }
}
