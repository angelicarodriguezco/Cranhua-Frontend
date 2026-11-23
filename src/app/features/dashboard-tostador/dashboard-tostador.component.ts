import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IndicadoresTostador } from '../../core/models/dashboard-tostador.model';
import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { SesionService } from '../../core/services/sesion.service';
import { mensajeDeError } from '../../core/utils/auth-error';
import { ExploradorCosechasComponent } from '../../shared/components/explorador-cosechas/explorador-cosechas.component';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';
import { formatearKg } from '../../shared/utils/formato';

@Component({
  selector: 'app-dashboard-tostador',
  imports: [ExploradorCosechasComponent, MenuLateralComponent, RouterLink],
  templateUrl: './dashboard-tostador.component.html',
  styleUrl: './dashboard-tostador.component.css',
})
export class DashboardTostadorComponent {
  private readonly dashboard = inject(DashboardTostadorService);
  private readonly sesion = inject(SesionService);

  protected readonly usuario = this.sesion.usuario;
  protected readonly tema = this.dashboard.tema;
  protected readonly indicadores = signal<IndicadoresTostador | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly kg = formatearKg;

  constructor() {
    this.dashboard.obtenerIndicadores().subscribe({
      next: (indicadores) => this.indicadores.set(indicadores),
      error: (error: unknown) => this.error.set(mensajeDeError(error)),
    });
  }
}
