import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, map, of, switchMap } from 'rxjs';

import { DetalleCosecha } from '../../core/models/detalle-cosecha.model';
import { ErrorSolicitud } from '../../core/models/solicitud.model';
import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { DetalleCosechaService } from '../../core/services/detalle-cosecha.service';
import { parsearErrorAuth } from '../../core/utils/auth-error';
import { etiquetaFinca, iniciales, nombreCorto } from '../../shared/utils/formato';
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

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly cosecha = signal<DetalleCosecha | undefined>(undefined);
  protected readonly enviando = signal(false);
  protected readonly errorSolicitud = signal<string | null>(null);

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

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((params) => params.get('id') ?? ''),
        switchMap((id) => {
          this.cargando.set(true);
          this.errorCarga.set(null);
          this.cosecha.set(undefined);
          return this.servicio.obtener(id).pipe(
            catchError((err: unknown) => {
              this.errorCarga.set(
                err instanceof HttpErrorResponse && err.error?.mensaje
                  ? String(err.error.mensaje)
                  : parsearErrorAuth(err).mensaje,
              );
              return of(undefined);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((detalle) => {
        this.cosecha.set(detalle);
        this.cargando.set(false);
      });

    this.cantidad.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.errorSolicitud.set(null);
    });
  }

  protected readonly etiquetaFinca = etiquetaFinca;

  protected colones(monto: number): string {
    return colones.format(monto);
  }

  protected enviar(): void {
    const cosecha = this.cosecha();
    if (!cosecha || this.formulario.invalid || this.enviando()) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorSolicitud.set(null);
    this.servicio
      .enviarSolicitud({
        cosechaId: cosecha.id,
        kilos: this.cantidad.value ?? 0,
        precioKg: cosecha.precioKg,
      })
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/tostador/solicitudes']),
        error: (err: ErrorSolicitud) => {
          this.errorSolicitud.set(err.errores?.['cantidadKg'] ?? err.mensaje);
        },
      });
  }

  private validarDisponible(control: AbstractControl): ValidationErrors | null {
    const disponible = this.cosecha()?.kgDisponibles ?? 0;
    const pedido = control.value as number | null;
    return pedido !== null && pedido > disponible ? { excedeDisponible: { disponible } } : null;
  }
}
