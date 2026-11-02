import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Cosecha } from '../../../../core/models/cosecha.model';

@Component({
  selector: 'app-tabla-cosechas',
  imports: [RouterLink],
  templateUrl: './tabla-cosechas.component.html',
  styleUrl: './tabla-cosechas.component.css',
})
export class TablaCosechasComponent {
  readonly cosechas = input.required<Cosecha[]>();
}
