import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

import { Cosecha } from '../../../../core/models/cosecha.model';
import { etiquetaFinca, formatearColones } from '../../../../shared/utils/formato';

@Component({
  selector: 'app-resumen-cosecha',
  imports: [DecimalPipe],
  templateUrl: './resumen-cosecha.component.html',
  styleUrl: './resumen-cosecha.component.css',
})
export class ResumenCosechaComponent {
  readonly cosecha = input.required<Cosecha>();
  readonly modoEdicion = input(false);

  readonly registrarOtra = output<void>();
  readonly verCosecha = output<string>();

  protected readonly etiquetaFinca = computed(() => etiquetaFinca(this.cosecha().fincaNombre ?? ''));

  protected readonly precioKg = computed(() => formatearColones(this.cosecha().precioKg));

  protected readonly procesosResumen = computed(() => {
    const c = this.cosecha();
    return c.procesos.map((proceso) => {
      const kg = (c.cantidadTotalKg * proceso.porcentaje) / 100;
      return {
        texto: `${proceso.proceso} ${proceso.porcentaje}% (${formatKg(kg)} kg)`,
      };
    });
  });

  protected readonly titulo = computed(() =>
    this.modoEdicion() ? '¡Cosecha actualizada!' : '¡Cosecha registrada!',
  );

  protected readonly mensaje = computed(() =>
    this.modoEdicion()
      ? 'Los cambios se guardaron correctamente.'
      : `Ya quedó disponible en ${this.etiquetaFinca()}. En cuanto termine el beneficiado, los tostadores van a poder solicitarla.`,
  );

  protected readonly textoCaracolillo = computed(() => {
    const c = this.cosecha();
    if (c.separoCaracolillo === true && c.pesoCaracolilloKg !== null) {
      return `Sí, ${formatKg(c.pesoCaracolilloKg)} kg`;
    }
    if (c.separoCaracolillo === false) {
      return 'No';
    }
    return null;
  });

  protected onRegistrarOtra(): void {
    this.registrarOtra.emit();
  }

  protected onVerCosecha(): void {
    this.verCosecha.emit(this.cosecha().id);
  }
}

function formatKg(valor: number): string {
  return new Intl.NumberFormat('es-CR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(valor);
}
