import { Component, input, output } from '@angular/core';

import { NegocioTueste } from '../../../../core/models/negocio-tueste.model';

const lista = new Intl.ListFormat('es', { type: 'conjunction' });

@Component({
  selector: 'app-confirmacion-tostador',
  templateUrl: './confirmacion-tostador.component.html',
  styleUrl: './confirmacion-tostador.component.css',
})
export class ConfirmacionTostadorComponent {
  readonly negocio = input.required<NegocioTueste>();
  readonly irAlDashboard = output();
  readonly editar = output();

  protected listar(estilos: string[]): string {
    return lista.format(estilos);
  }
}
