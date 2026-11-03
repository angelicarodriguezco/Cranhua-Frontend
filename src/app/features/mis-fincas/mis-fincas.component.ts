import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { FincaService } from '../../core/services/finca.service';
import { SesionService } from '../../core/services/sesion.service';
import { TarjetaFincaComponent } from './components/tarjeta-finca/tarjeta-finca.component';

@Component({
  selector: 'app-mis-fincas',
  imports: [RouterLink, TarjetaFincaComponent],
  templateUrl: './mis-fincas.component.html',
  styleUrl: './mis-fincas.component.css',
})
export class MisFincasComponent {
  private readonly usuario = inject(SesionService).usuario;

  protected readonly fincas = toSignal(inject(FincaService).misFincas(this.usuario().id), {
    initialValue: [],
  });
}
