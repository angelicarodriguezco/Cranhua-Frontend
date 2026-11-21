import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CosechaDisponible } from '../../../core/models/cosecha-disponible.model';
import { etiquetaFinca } from '../../utils/formato';

const colones = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-cuadricula-cosechas',
  imports: [RouterLink],
  templateUrl: './cuadricula-cosechas.component.html',
  styleUrl: './cuadricula-cosechas.component.css',
})
export class CuadriculaCosechasComponent {
  readonly cosechas = input.required<CosechaDisponible[]>();

  protected readonly etiquetaFinca = etiquetaFinca;

  protected precio(cosecha: CosechaDisponible): string {
    return colones.format(cosecha.precioDesdeKg);
  }
}
