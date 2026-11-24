import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { Finca } from '../../core/models/finca.model';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { FincaService } from '../../core/services/finca.service';
import { SesionService } from '../../core/services/sesion.service';
import { mensajeDeError, parsearErrorAuth } from '../../core/utils/auth-error';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

@Component({
  selector: 'app-dashboard-cafetalero',
  imports: [MenuLateralComponent, RouterLink],
  templateUrl: './dashboard-cafetalero.component.html',
  styleUrl: './dashboard-cafetalero.component.css',
})
export class DashboardCafetaleroComponent {
  private readonly dashboard = inject(DashboardCafetaleroService);
  private readonly fincaService = inject(FincaService);
  private readonly sesion = inject(SesionService);

  protected readonly usuario = this.sesion.usuario;
  protected readonly tema = this.dashboard.tema;
  protected readonly indicadores = this.dashboard.indicadores;
  protected readonly solicitudes = this.dashboard.solicitudesPendientes;
  protected readonly cosechas = this.dashboard.cosechasRecientes;

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly fincas = signal<Finca[]>([]);
  protected readonly cargandoFincas = signal(true);
  protected readonly errorFincas = signal<string | null>(null);

  protected readonly respondiendo = signal<string | null>(null);
  protected readonly errorSolicitudes = signal<string | null>(null);

  constructor() {
    this.cargarResumen();
    this.cargarFincas();
  }

  protected ubicacionFinca(finca: Finca): string {
    const partes = [finca.canton?.nombre, finca.zona].filter(Boolean);
    return partes.length > 0 ? partes.join(', ') : '—';
  }

  protected cosechasActivas(finca: Finca): number {
    return finca.cosechasActivas ?? 0;
  }

  protected aprobar(id: string): void {
    this.responder(id, this.dashboard.aprobarSolicitud(id));
  }

  protected rechazar(id: string): void {
    this.responder(id, this.dashboard.rechazarSolicitud(id));
  }

  protected reintentar(): void {
    this.cargarResumen();
  }

  protected reintentarFincas(): void {
    this.cargarFincas();
  }

  private cargarResumen(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.errorSolicitudes.set(null);
    this.dashboard.obtenerResumen().subscribe({
      next: () => this.cargando.set(false),
      error: (error: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(error));
      },
    });
  }

  private cargarFincas(): void {
    this.cargandoFincas.set(true);
    this.errorFincas.set(null);
    this.fincaService.misFincas().subscribe({
      next: (fincas) => {
        this.fincas.set(fincas);
        this.cargandoFincas.set(false);
      },
      error: () => {
        this.cargandoFincas.set(false);
        this.errorFincas.set('No pudimos cargar tus fincas. Intentá de nuevo.');
      },
    });
  }

  private responder(id: string, peticion: Observable<void>): void {
    this.respondiendo.set(id);
    this.errorSolicitudes.set(null);
    peticion.subscribe({
      next: () => this.respondiendo.set(null),
      error: (error: unknown) => {
        this.respondiendo.set(null);
        this.errorSolicitudes.set(parsearErrorAuth(error).mensaje);
        this.dashboard.obtenerResumen().subscribe({ error: () => undefined });
      },
    });
  }
}
