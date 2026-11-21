import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { SesionService } from '../../core/services/sesion.service';
import { parsearErrorAuth } from '../../core/utils/auth-error';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

@Component({
  selector: 'app-dashboard-cafetalero',
  imports: [MenuLateralComponent, RouterLink],
  templateUrl: './dashboard-cafetalero.component.html',
  styleUrl: './dashboard-cafetalero.component.css',
})
export class DashboardCafetaleroComponent {
  private readonly dashboard = inject(DashboardCafetaleroService);
  private readonly sesion = inject(SesionService);

  protected readonly usuario = this.sesion.usuario;
  protected readonly tema = this.dashboard.tema;
  protected readonly indicadores = this.dashboard.indicadores;
  protected readonly solicitudes = this.dashboard.solicitudesPendientes;
  protected readonly fincas = this.dashboard.fincasResumen;
  protected readonly cosechas = this.dashboard.cosechasRecientes;

  protected readonly cargandoSolicitudes = signal(true);
  /** Solicitud que se está aprobando o rechazando */
  protected readonly respondiendo = signal<string | null>(null);
  protected readonly errorSolicitudes = signal<string | null>(null);

  constructor() {
    this.cargarSolicitudes();
  }

  protected aprobar(id: string): void {
    this.responder(id, this.dashboard.aprobarSolicitud(id));
  }

  protected rechazar(id: string): void {
    this.responder(id, this.dashboard.rechazarSolicitud(id));
  }

  private cargarSolicitudes(): void {
    this.dashboard.cargarSolicitudesPendientes().subscribe({
      next: () => this.cargandoSolicitudes.set(false),
      error: () => {
        this.cargandoSolicitudes.set(false);
        this.errorSolicitudes.set('No pudimos cargar las solicitudes. Intentá de nuevo.');
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
        // Si otro dueño ya la respondió, la lista se pone al día
        this.dashboard.cargarSolicitudesPendientes().subscribe({ error: () => undefined });
      },
    });
  }
}
