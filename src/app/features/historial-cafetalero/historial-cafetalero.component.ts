import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { HistorialCafetaleroService } from '../../core/services/historial-cafetalero.service';
import { mensajeDeError } from '../../core/utils/auth-error';
import { formatearColones, formatearFecha, formatearKg } from '../../shared/utils/formato';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

@Component({
  selector: 'app-historial-cafetalero',
  imports: [MenuLateralComponent, RouterLink],
  templateUrl: './historial-cafetalero.component.html',
  styleUrl: './historial-cafetalero.component.css',
})
export class HistorialCafetaleroComponent {
  private readonly panel = inject(DashboardCafetaleroService);
  private readonly historial = inject(HistorialCafetaleroService);

  protected readonly tema = this.panel.tema;
  protected readonly indicadores = this.historial.indicadores;
  protected readonly cosechas = this.historial.cosechas;
  protected readonly lotes = this.historial.lotesVendidos;

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly fecha = formatearFecha;
  protected readonly kg = formatearKg;
  protected readonly colones = formatearColones;

  constructor() {
    this.cargar();
  }

  protected reintentar(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.historial.cargar().subscribe({
      next: () => this.cargando.set(false),
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(error));
      },
    });
  }
}
