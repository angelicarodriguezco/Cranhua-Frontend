import { Component, computed, effect, inject, signal, untracked } from '@angular/core';

import {
  CosechaDisponible,
  FiltrosCosechas,
  RANGOS_PRECIO_COSECHA,
  RangoPrecioCosecha,
  SIN_FILTROS,
} from '../../../core/models/cosecha-disponible.model';
import { ZONAS_CAFETALERAS, ZonaCafetalera } from '../../../core/models/finca.model';
import {
  CosechasDisponiblesService,
  filtrarCosechas,
} from '../../../core/services/cosechas-disponibles.service';
import { parsearErrorAuth } from '../../../core/utils/auth-error';
import { CuadriculaCosechasComponent } from '../cuadricula-cosechas/cuadricula-cosechas.component';

type FiltroRapido = 'soloDisponibles' | 'soloFlorales' | 'soloHoney';

@Component({
  selector: 'app-explorador-cosechas',
  imports: [CuadriculaCosechasComponent],
  templateUrl: './explorador-cosechas.component.html',
  styleUrl: './explorador-cosechas.component.css',
})
export class ExploradorCosechasComponent {
  private readonly servicio = inject(CosechasDisponiblesService);

  protected readonly filtros = signal<FiltrosCosechas>(SIN_FILTROS);
  protected readonly cosechas = signal<CosechaDisponible[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly rangosPrecio = (
    Object.entries(RANGOS_PRECIO_COSECHA) as [RangoPrecioCosecha, { etiqueta: string }][]
  ).map(([id, rango]) => ({ id, etiqueta: rango.etiqueta }));

  protected readonly zonas = ZONAS_CAFETALERAS;

  protected readonly sinFiltros = computed(() => {
    const f = this.filtros();
    return (
      !f.soloDisponibles &&
      !f.zona &&
      !f.variedad &&
      !f.rangoPrecio &&
      !f.soloFlorales &&
      !f.soloHoney
    );
  });

  private readonly claveFiltrosServidor = computed(() => {
    const f = this.filtros();
    return `${f.zona ?? ''}|${f.soloFlorales}|${f.soloHoney}`;
  });

  protected readonly variedades = computed(() =>
    [...new Set(this.cosechas().map((c) => c.variedad))].sort((a, b) => a.localeCompare(b, 'es')),
  );

  protected readonly cosechasFiltradas = computed(() =>
    filtrarCosechas(this.cosechas(), this.filtros()),
  );

  constructor() {
    effect((onCleanup) => {
      void this.claveFiltrosServidor();
      const f = untracked(() => this.filtros());
      this.cargando.set(true);
      this.error.set(null);

      const sub = this.servicio
        .listar({
          zona: f.zona,
          florales: f.soloFlorales,
          honey: f.soloHoney,
        })
        .subscribe({
          next: (lista) => {
            this.cosechas.set(lista);
            this.cargando.set(false);
          },
          error: (err: unknown) => {
            this.cosechas.set([]);
            this.error.set(parsearErrorAuth(err).mensaje);
            this.cargando.set(false);
          },
        });

      onCleanup(() => sub.unsubscribe());
    });
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

  protected elegirVariedad(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value;
    this.filtros.update((f) => ({ ...f, variedad: valor || null }));
  }

  protected elegirPrecio(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value as RangoPrecioCosecha | '';
    this.filtros.update((f) => ({ ...f, rangoPrecio: valor || null }));
  }
}
