import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { EstadoSolicitud } from '../../core/models/solicitud.model';
import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { SolicitudesService, calcularIndicadores } from '../../core/services/solicitudes.service';
import { formatearFecha, formatearKg } from '../../shared/utils/formato';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

const CLASE_ESTADO: Record<EstadoSolicitud, string> = {
  Pendiente: 'pill pill--pendiente',
  Aprobada: 'pill pill--aprobada',
  Rechazada: 'pill pill--rechazada',
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

  protected readonly tema = this.dashboard.tema;

  protected readonly solicitudes = toSignal(inject(SolicitudesService).listar(), {
    initialValue: [],
  });
  protected readonly indicadores = computed(() => calcularIndicadores(this.solicitudes()));

  protected readonly rutaExplorarCosechas = '/tostador/cosechas';
  protected readonly claseEstado = CLASE_ESTADO;
  protected readonly fecha = formatearFecha;
  protected readonly kg = formatearKg;
}
