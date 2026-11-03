import { Component, computed, inject, signal } from '@angular/core';

import { FiltrosCosechas, SIN_FILTROS } from '../../../core/models/cosecha-disponible.model';
import { ZONAS_CAFETALERAS, ZonaCafetalera } from '../../../core/models/finca.model';
import {
  CosechasDisponiblesService,
  filtrarCosechas,
} from '../../../core/services/cosechas-disponibles.service';
import { CuadriculaCosechasComponent } from '../cuadricula-cosechas/cuadricula-cosechas.component';

type FiltroRapido = 'soloDisponibles' | 'soloFlorales' | 'soloHoney';

// Filtros rápidos + cuadrícula de cosechas: lo usan Explorar cosechas y el dashboard del tostador
@Component({
  selector: 'app-explorador-cosechas',
  imports: [CuadriculaCosechasComponent],
  templateUrl: './explorador-cosechas.component.html',
  styleUrl: './explorador-cosechas.component.css',
})
export class ExploradorCosechasComponent {
  private readonly cosechas = inject(CosechasDisponiblesService).cosechas;

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
