import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';

import { Finca } from '../../../../core/models/finca.model';
import { CosechaService } from '../../../../core/services/cosecha.service';

@Component({
  selector: 'app-tarjeta-finca',
  imports: [RouterLink],
  templateUrl: './tarjeta-finca.component.html',
  styleUrl: './tarjeta-finca.component.css',
})
export class TarjetaFincaComponent {
  private readonly cosechas = inject(CosechaService);

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

  private readonly resumenCosechas = toSignal(
    toObservable(this.finca).pipe(
      switchMap((finca) =>
        finca
          ? this.cosechas.deFinca(finca.id).pipe(
              map((lista) => ({
                cantidad: lista.length,
                kg: lista.reduce((total, c) => total + (c.kgDisponibles ?? 0), 0),
              })),
            )
          : of({ cantidad: 0, kg: 0 }),
      ),
    ),
    { initialValue: { cantidad: 0, kg: 0 } },
  );

  protected readonly textoCosechas = computed(() => {
    const n = this.resumenCosechas().cantidad;
    return `${n} ${n === 1 ? 'cosecha' : 'cosechas'}`;
  });

  protected readonly textoKg = computed(() => `${this.resumenCosechas().kg} kg disponibles`);

  protected readonly textoDuenos = computed(() => {
    const n = this.duenos();
    return `${n} ${n === 1 ? 'dueño' : 'dueños'}`;
  });
}
