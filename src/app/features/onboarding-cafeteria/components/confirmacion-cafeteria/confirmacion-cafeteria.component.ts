import { Component, computed, input, output } from '@angular/core';

import { Cafeteria } from '../../../../core/models/cafeteria.model';

@Component({
  selector: 'app-confirmacion-cafeteria',
  templateUrl: './confirmacion-cafeteria.component.html',
  styleUrls: ['../paso-cafeteria.css', './confirmacion-cafeteria.component.css'],
})
export class ConfirmacionCafeteriaComponent {
  readonly cafeteria = input.required<Cafeteria>();
  readonly irAlDashboard = output();
  readonly editar = output();

  protected readonly estilos = computed(() => this.cafeteria().estilos.join(', '));
}
