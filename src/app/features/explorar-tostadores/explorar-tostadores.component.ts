import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';

import { ESTILOS_TUESTE, EstiloTueste } from '../../core/models/negocio-tueste.model';
import {
  FiltrosTostadores,
  SIN_FILTROS,
  TostadorDisponible,
} from '../../core/models/tostador-disponible.model';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { TostadoresDisponiblesService } from '../../core/services/tostadores-disponibles.service';
import { parsearErrorAuth } from '../../core/utils/auth-error';
import { formatearKg } from '../../shared/utils/formato';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

@Component({
  selector: 'app-explorar-tostadores',
  imports: [MenuLateralComponent, RouterLink],
  templateUrl: './explorar-tostadores.component.html',
  styleUrl: './explorar-tostadores.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class ExplorarTostadoresComponent {
  private readonly panel = inject(DashboardCafeteriaService);
  private readonly tostadoresService = inject(TostadoresDisponiblesService);

  protected readonly tema = this.panel.tema;

  protected readonly estilos = ESTILOS_TUESTE;
  protected readonly filtros = signal<FiltrosTostadores>(SIN_FILTROS);
  protected readonly sinFiltros = computed(() => {
    const f = this.filtros();
    return !f.estilo && !f.soloConCafe;
  });
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly tostadores = signal<TostadorDisponible[]>([]);
  protected readonly kg = formatearKg;

  private readonly recargas = signal(0);

  constructor() {
    toObservable(computed(() => ({ filtros: this.filtros(), recarga: this.recargas() })))
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
        }),
        switchMap(({ filtros }) =>
          this.tostadoresService.listar(filtros).pipe(
            catchError((err: unknown) => {
              this.error.set(parsearErrorAuth(err).mensaje);
              return of([] as TostadorDisponible[]);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((tostadores) => {
        this.tostadores.set(tostadores);
        this.cargando.set(false);
      });
  }

  protected reintentar(): void {
    this.recargas.update((n) => n + 1);
  }

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
