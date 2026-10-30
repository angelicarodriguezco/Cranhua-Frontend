import { Component, computed, input, output } from '@angular/core';

import { Finca } from '../../../../core/models/finca.model';
import { formatearHectareas, listar, nombreCorto } from '../../../../shared/utils/formato';

@Component({
  selector: 'app-confirmacion-finca',
  templateUrl: './confirmacion-finca.component.html',
  styleUrl: './confirmacion-finca.component.css',
})
export class ConfirmacionFincaComponent {
  readonly finca = input.required<Finca>();
  readonly nombrePropietario = input.required<string>();
  readonly irAlDashboard = output();
  readonly registrarOtra = output();

  protected readonly area = computed(() => formatearHectareas(this.finca().areaHectareas));
  protected readonly duenos = computed(() =>
    listar([this.nombrePropietario(), ...this.finca().duenosAdicionales.map(nombreCorto)]),
  );
}
