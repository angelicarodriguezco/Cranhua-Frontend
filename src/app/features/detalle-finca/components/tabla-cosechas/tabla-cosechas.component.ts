import { Component, ElementRef, afterRenderEffect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Cosecha } from '../../../../core/models/cosecha.model';
import { formatearColones } from '../../../../shared/utils/formato';

@Component({
  selector: 'app-tabla-cosechas',
  imports: [RouterLink],
  templateUrl: './tabla-cosechas.component.html',
  styleUrl: './tabla-cosechas.component.css',
})
export class TablaCosechasComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly cosechas = input.required<Cosecha[]>();
  readonly resaltada = input<string | null>(null);

  protected readonly colones = formatearColones;

  constructor() {
    afterRenderEffect(() => {
      if (this.resaltada() && this.cosechas().length > 0) {
        this.host.nativeElement
          .querySelector('.fila-resaltada')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
}
