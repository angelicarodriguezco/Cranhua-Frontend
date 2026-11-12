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

import { TuesteDisponible } from '../../core/models/detalle-tostador.model';
import { DashboardCafeteriaService } from '../../core/services/dashboard-cafeteria.service';
import { DetalleTostadorService } from '../../core/services/detalle-tostador.service';
import { PedidosService } from '../../core/services/pedidos.service';
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
  // El tema y el perfil del menú se comparten con el resto del panel de cafetería
  private readonly panel = inject(DashboardCafeteriaService);

  protected readonly tema = this.panel.tema;
  protected readonly rutaExplorar = RUTA_EXPLORAR_TOSTADORES;
  protected readonly kg = formatearKg;

  protected readonly tostador = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      switchMap((params) => this.servicio.obtener(params.get('id') ?? '')),
    ),
  );

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
    this.tuesteId.valueChanges.subscribe(() => this.cantidad.updateValueAndValidity());
  }

  protected elegir(tueste: TuesteDisponible): void {
    this.tuesteId.setValue(tueste.id);
    this.tuesteId.markAsTouched();
  }

  protected enviar(): void {
    const tostador = this.tostador();
    const tueste = this.tuesteElegido();
    if (!tostador || !tueste || this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.pedidos
      .crear(tostador.nombre, this.cantidad.value ?? 0)
      .subscribe(() => this.router.navigate([RUTA_MIS_PEDIDOS]));
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
