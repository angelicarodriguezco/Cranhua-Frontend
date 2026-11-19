import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Finca } from '../../../../core/models/finca.model';

@Component({
  selector: 'app-tarjeta-finca',
  imports: [RouterLink],
  templateUrl: './tarjeta-finca.component.html',
  styleUrl: './tarjeta-finca.component.css',
})
export class TarjetaFincaComponent {
  readonly finca = input.required<Finca>();

  protected readonly ubicacion = computed(() => {
    const canton = this.finca().canton;
    if (canton) {
      return `${canton.nombre}, Costa Rica`;
    }
    return this.finca().zona ? `${this.finca().zona}, Costa Rica` : 'Ubicación pendiente';
  });

  protected readonly area = computed(() => {
    const ha = this.finca().areaHectareas;
    return `${ha.toFixed(ha < 1 ? 2 : 1)} ha`;
  });

  protected readonly duenos = computed(() => 1 + this.finca().duenosAdicionales.length);

  protected readonly textoCosechas = computed(() => {
    const n = this.finca().cosechasActivas ?? 0;
    return `${n} ${n === 1 ? 'cosecha activa' : 'cosechas activas'}`;
  });

  protected readonly textoKg = computed(() => `${this.finca().kgDisponibles ?? 0} kg disponibles`);

  protected readonly textoDuenos = computed(() => {
    const n = this.duenos();
    return `${n} ${n === 1 ? 'dueño' : 'dueños'}`;
  });
}
