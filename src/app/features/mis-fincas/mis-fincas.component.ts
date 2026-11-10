import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Finca } from '../../core/models/finca.model';
import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { FincaService } from '../../core/services/finca.service';
import { TarjetaFincaComponent } from './components/tarjeta-finca/tarjeta-finca.component';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

export const RUTA_REGISTRAR_FINCA = '/cafetalero/fincas/registrar';

@Component({
  selector: 'app-mis-fincas',
  imports: [RouterLink, TarjetaFincaComponent, MenuLateralComponent],
  templateUrl: './mis-fincas.component.html',
  styleUrl: './mis-fincas.component.css',
})
export class MisFincasComponent {
  private readonly panel = inject(DashboardCafetaleroService);
  private readonly fincaService = inject(FincaService);

  protected readonly tema = this.panel.tema;
  protected readonly rutaRegistrar = RUTA_REGISTRAR_FINCA;

  protected readonly estado = signal<'cargando' | 'listo' | 'error'>('cargando');
  protected readonly fincas = signal<Finca[]>([]);

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.estado.set('cargando');
    this.fincaService.misFincas().subscribe({
      next: (fincas) => {
        this.fincas.set(fincas);
        this.estado.set('listo');
      },
      error: () => this.estado.set('error'),
    });
  }
}
