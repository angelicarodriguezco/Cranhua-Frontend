import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EstadoCosechaHistorial } from '../../core/models/historial-cafetalero.model';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { HistorialCafetaleroService } from '../../core/services/historial-cafetalero.service';
import { formatearColones, formatearFecha, formatearKg } from '../../shared/utils/formato';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

const CLASE_ESTADO: Record<EstadoCosechaHistorial, string> = {
  Disponible: 'pill-disponible',
  'En beneficiado': 'pill-beneficiado',
  'En catación': 'pill-catacion',
  Vendida: 'pill-vendida',
};

@Component({
  selector: 'app-historial-cafetalero',
  imports: [MenuLateralComponent, RouterLink],
  templateUrl: './historial-cafetalero.component.html',
  styleUrl: './historial-cafetalero.component.css',
})
export class HistorialCafetaleroComponent {
  // El tema y el perfil del menú son los del panel, así se mantienen al navegar
  private readonly panel = inject(DashboardCafetaleroService);
  private readonly historial = inject(HistorialCafetaleroService);

  protected readonly tema = this.panel.tema;
  protected readonly indicadores = this.historial.indicadores;
  protected readonly cosechas = this.historial.cosechas;
  protected readonly lotes = this.historial.lotesVendidos;

  protected readonly claseEstado = CLASE_ESTADO;
  protected readonly fecha = formatearFecha;
  protected readonly kg = formatearKg;
  protected readonly colones = formatearColones;
}
