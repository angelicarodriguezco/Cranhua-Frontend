import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  EstadoSolicitud,
  IndicadoresSolicitudes,
  Solicitud,
} from '../../core/models/solicitud.model';
import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { SolicitudesService } from '../../core/services/solicitudes.service';
import { parsearErrorAuth } from '../../core/utils/auth-error';
import { formatearFecha, formatearKg } from '../../shared/utils/formato';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

const CLASE_ESTADO: Record<EstadoSolicitud, string> = {
  Pendiente: 'pill pill--pendiente',
  Aprobada: 'pill pill--aprobada',
  Rechazada: 'pill pill--rechazada',
};

const INDICADORES_VACIOS: IndicadoresSolicitudes = {
  pendientes: 0,
  esteMes: 0,
  fincasContactadas: 0,
};

@Component({
  selector: 'app-mis-solicitudes',
  imports: [MenuLateralComponent, RouterLink],
  templateUrl: './mis-solicitudes.component.html',
  styleUrl: './mis-solicitudes.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class MisSolicitudesComponent {
  private readonly dashboard = inject(DashboardTostadorService);
  private readonly solicitudesService = inject(SolicitudesService);

  protected readonly tema = this.dashboard.tema;

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly solicitudes = signal<Solicitud[]>([]);
  protected readonly indicadores = signal<IndicadoresSolicitudes>(INDICADORES_VACIOS);

  protected readonly rutaExplorarCosechas = '/tostador/cosechas';
  protected readonly claseEstado = CLASE_ESTADO;
  protected readonly fecha = formatearFecha;
  protected readonly kg = formatearKg;

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.solicitudesService.listar().subscribe({
      next: ({ indicadores, solicitudes }) => {
        this.indicadores.set(indicadores);
        this.solicitudes.set(solicitudes);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.solicitudes.set([]);
        this.indicadores.set(INDICADORES_VACIOS);
        this.error.set(parsearErrorAuth(err).mensaje);
        this.cargando.set(false);
      },
    });
  }
}
