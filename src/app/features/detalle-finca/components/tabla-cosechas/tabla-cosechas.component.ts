import {
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { Cosecha } from '../../../../core/models/cosecha.model';
import { ModalConfirmacionComponent } from '../../../../shared/components/modal-confirmacion/modal-confirmacion.component';
import { formatearColones } from '../../../../shared/utils/formato';

@Component({
  selector: 'app-tabla-cosechas',
  imports: [ModalConfirmacionComponent, RouterLink],
  templateUrl: './tabla-cosechas.component.html',
  styleUrl: './tabla-cosechas.component.css',
})
export class TablaCosechasComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly cosechas = input.required<Cosecha[]>();
  readonly resaltada = input<string | null>(null);
  readonly procesando = input<string | null>(null);

  readonly publicar = output<string>();
  readonly retirar = output<string>();

  protected readonly colones = formatearColones;
  protected readonly porRetirar = signal<string | null>(null);

  constructor() {
    afterRenderEffect(() => {
      if (this.resaltada() && this.cosechas().length > 0) {
        this.host.nativeElement
          .querySelector('.fila-resaltada')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  protected confirmarRetiro(): void {
    const id = this.porRetirar();
    this.porRetirar.set(null);
    if (id) {
      this.retirar.emit(id);
    }
  }
}
