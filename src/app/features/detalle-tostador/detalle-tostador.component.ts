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
import { catchError, finalize, map, merge, of, switchMap } from 'rxjs';

import { DetalleTostador, TuesteDisponible } from '../../core/models/detalle-tostador.model';
import { ErrorPedido } from '../../core/models/pedido.model';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { DetalleTostadorService } from '../../core/services/detalle-tostador.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { parsearErrorAuth } from '../../core/utils/auth-error';
import { formatearKg } from '../../shared/utils/formato';
import { RUTA_EXPLORAR_TOSTADORES } from '../mis-pedidos/mis-pedidos.component';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

export const RUTA_MIS_PEDIDOS = '/cafeteria/pedidos';

@Component({
  selector: 'app-detalle-tostador',
  imports: [MenuLateralComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './detalle-tostador.component.html',
  styleUrl: './detalle-tostador.component.css',
  host: { '[attr.data-theme]': 'tema()' },
})
export class DetalleTostadorComponent {
  private readonly servicio = inject(DetalleTostadorService);
  private readonly pedidos = inject(PedidosService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly panel = inject(DashboardCafeteriaService);

  protected readonly tema = this.panel.tema;
  protected readonly rutaExplorar = RUTA_EXPLORAR_TOSTADORES;
  protected readonly kg = formatearKg;

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly tostador = signal<DetalleTostador | undefined>(undefined);
  protected readonly enviando = signal(false);
  protected readonly errorPedido = signal<string | null>(null);

  protected readonly formulario = new FormGroup({
    tuesteId: new FormControl<string | null>(null, Validators.required),
    cantidad: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      (control: AbstractControl): ValidationErrors | null => this.validarDisponible(control),
    ]),
  });
  protected readonly tuesteId = this.formulario.controls.tuesteId;
  protected readonly cantidad = this.formulario.controls.cantidad;
  private readonly tuesteIdValor = toSignal(this.tuesteId.valueChanges, { initialValue: null });

  protected readonly tuesteElegido = computed(() => this.buscarTueste(this.tuesteIdValor()));

  protected readonly iniciales = computed(() =>
    (this.tostador()?.nombre ?? '')
      .split(' ')
      .slice(0, 2)
      .map((palabra) => palabra[0])
      .join('')
      .toUpperCase(),
  );

  constructor() {
    this.ruta.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        switchMap((id) => this.cargar(id)),
        takeUntilDestroyed(),
      )
      .subscribe((detalle) => {
        this.tostador.set(detalle);
        this.cargando.set(false);
      });

    this.tuesteId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cantidad.updateValueAndValidity());
    merge(this.tuesteId.valueChanges, this.cantidad.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.errorPedido.set(null));
  }

  protected reintentar(): void {
    const id = this.ruta.snapshot.paramMap.get('id') ?? '';
    this.cargar(id).subscribe((detalle) => {
      this.tostador.set(detalle);
      this.cargando.set(false);
    });
  }

  protected elegir(tueste: TuesteDisponible): void {
    this.tuesteId.setValue(tueste.id);
    this.tuesteId.markAsTouched();
  }

  protected enviar(): void {
    const tueste = this.tuesteElegido();
    if (!this.tostador() || !tueste || this.formulario.invalid || this.enviando()) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorPedido.set(null);
    this.pedidos
      .crear({ tuesteId: tueste.id, kilos: this.cantidad.value ?? 0 })
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => void this.router.navigate([RUTA_MIS_PEDIDOS]),
        error: (err: ErrorPedido) => {
          this.errorPedido.set(err.errores?.['cantidadKg'] ?? err.mensaje);
        },
      });
  }

  private cargar(id: string) {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.tostador.set(undefined);
    this.formulario.reset();
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
  }

  private buscarTueste(id: string | null): TuesteDisponible | undefined {
    return this.tostador()?.tuestes.find((t) => t.id === id);
  }

  private validarDisponible(control: AbstractControl): ValidationErrors | null {
    const tueste = this.buscarTueste(control.parent?.get('tuesteId')?.value ?? null);
    const pedido = control.value as number | null;
    if (!tueste || pedido === null) {
      return null;
    }
    return pedido > tueste.kgDisponibles
      ? { excedeDisponible: { disponible: tueste.kgDisponibles } }
      : null;
  }
}
