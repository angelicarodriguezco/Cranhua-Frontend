import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { DetalleCosechaService } from '../../core/services/detalle-cosecha.service';
import { iniciales, nombreCorto } from '../../shared/utils/formato';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

const colones = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-detalle-cosecha',
  imports: [MenuLateralComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './detalle-cosecha.component.html',
  styleUrl: './detalle-cosecha.component.css',
})
export class DetalleCosechaComponent {
  private readonly servicio = inject(DetalleCosechaService);
  private readonly router = inject(Router);
  // El tema y el perfil del menú se comparten con el dashboard del tostador
  private readonly dashboard = inject(DashboardTostadorService);

  protected readonly tema = this.dashboard.tema;

  protected readonly cosecha = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      switchMap((params) => this.servicio.obtener(params.get('id') ?? '')),
    ),
  );

  protected readonly formulario = new FormGroup({
    cantidad: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      (control: AbstractControl): ValidationErrors | null => this.validarDisponible(control),
    ]),
  });
  protected readonly cantidad = this.formulario.controls.cantidad;
  private readonly cantidadValor = toSignal(this.cantidad.valueChanges, { initialValue: null });

  protected readonly total = computed(
    () => (this.cantidadValor() ?? 0) * (this.cosecha()?.precioKg ?? 0),
  );

  protected readonly productor = computed(() => {
    const productor = this.cosecha()?.productor;
    return productor
      ? { iniciales: iniciales(productor), nombreCorto: nombreCorto(productor) }
      : undefined;
  });

  protected colones(monto: number): string {
    return colones.format(monto);
  }

  protected enviar(): void {
    const cosecha = this.cosecha();
    if (!cosecha || this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.servicio
      .enviarSolicitud({
        cosechaId: cosecha.id,
        kilos: this.cantidad.value ?? 0,
        precioKg: cosecha.precioKg,
      })
      .subscribe(() => this.router.navigate(['/tostador/solicitudes']));
  }

  // No se puede pedir más de lo que el cafetalero tiene disponible
  private validarDisponible(control: AbstractControl): ValidationErrors | null {
    const disponible = this.cosecha()?.kgDisponibles ?? 0;
    const pedido = control.value as number | null;
    return pedido !== null && pedido > disponible ? { excedeDisponible: { disponible } } : null;
  }
}
