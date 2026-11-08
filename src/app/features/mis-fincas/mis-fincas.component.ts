import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { DashboardCafetaleroService } from '../../core/services/dashboard-cafetalero.service';
import { FincaService } from '../../core/services/finca.service';
import { SesionService } from '../../core/services/sesion.service';
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
  private readonly usuario = inject(SesionService).usuario;

  protected readonly tema = this.panel.tema;
  protected readonly rutaRegistrar = RUTA_REGISTRAR_FINCA;

  protected readonly fincas = toSignal(inject(FincaService).misFincas(this.usuario()?.id ?? ''), {
    initialValue: [],
  });
}
