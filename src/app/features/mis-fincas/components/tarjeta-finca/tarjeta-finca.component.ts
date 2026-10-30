import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Finca } from '../../../../core/models/finca.model';
import { formatearHectareas } from '../../../../shared/utils/formato';

@Component({
  selector: 'app-tarjeta-finca',
  imports: [RouterLink],
  templateUrl: './tarjeta-finca.component.html',
  styleUrl: './tarjeta-finca.component.css',
})
export class TarjetaFincaComponent {
  readonly finca = input.required<Finca>();

  protected readonly area = computed(() => formatearHectareas(this.finca().areaHectareas));
}
