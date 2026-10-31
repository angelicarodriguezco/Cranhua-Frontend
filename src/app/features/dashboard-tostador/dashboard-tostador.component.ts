import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { FiltrosCosechas, SIN_FILTROS } from '../../core/models/cosecha-disponible.model';
import { ZONAS_CAFETALERAS, ZonaCafetalera } from '../../core/models/finca.model';
import {
  CosechasDisponiblesService,
  filtrarCosechas,
} from '../../core/services/cosechas-disponibles.service';
import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { CuadriculaCosechasComponent } from '../../shared/components/cuadricula-cosechas/cuadricula-cosechas.component';
import { MenuLateralTostadorComponent } from './components/menu-lateral-tostador/menu-lateral-tostador.component';

type FiltroRapido = 'soloDisponibles' | 'soloFlorales' | 'soloHoney';

@Component({
  selector: 'app-dashboard-tostador',
  imports: [CuadriculaCosechasComponent, MenuLateralTostadorComponent, RouterLink],
  templateUrl: './dashboard-tostador.component.html',
  styleUrl: './dashboard-tostador.component.css',
})
export class DashboardTostadorComponent {
  private readonly dashboard = inject(DashboardTostadorService);
  private readonly cosechas = inject(CosechasDisponiblesService).cosechas;

  protected readonly tostador = this.dashboard.tostador;
  protected readonly perfilSidebar = this.dashboard.perfilSidebar;
  protected readonly indicadores = this.dashboard.indicadores;
  protected readonly tema = this.dashboard.tema;

  protected readonly filtros = signal<FiltrosCosechas>(SIN_FILTROS);
  protected readonly sinFiltros = computed(() => {
    const f = this.filtros();
    return !f.soloDisponibles && !f.zona && !f.soloFlorales && !f.soloHoney;
  });
  // Solo las zonas que tienen cosechas, en el orden de la lista del ICAFE
  protected readonly zonas = computed(() =>
    ZONAS_CAFETALERAS.filter((zona) => this.cosechas().some((c) => c.zona === zona)),
  );
  protected readonly cosechasFiltradas = computed(() =>
    filtrarCosechas(this.cosechas(), this.filtros()),
  );

  protected alternarTema(): void {
    this.dashboard.alternarTema();
  }

  protected limpiarFiltros(): void {
    this.filtros.set(SIN_FILTROS);
  }

  protected alternar(filtro: FiltroRapido): void {
    this.filtros.update((f) => ({ ...f, [filtro]: !f[filtro] }));
  }

  protected elegirZona(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.filtros.update((f) => ({ ...f, zona: (valor || null) as ZonaCafetalera | null }));
  }
}
