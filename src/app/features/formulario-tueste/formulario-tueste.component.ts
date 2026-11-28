import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { ESTILOS_TUESTE, EstiloTueste } from '../../core/models/negocio-tueste.model';
import { ErrorTueste, LoteConKgPorTostar, Tueste } from '../../core/models/tueste.model';
import { DashboardTostadorService } from '../../core/services/dashboard-tostador.service';
import { TuesteService, calcularMerma } from '../../core/services/tueste.service';
import { MenuLateralComponent } from '../../shared/components/menu-lateral/menu-lateral.component';

export const RUTA_MIS_TOSTADOS = '/tostador/tostados';

export function hoy(): string {
  return formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
}

function fechaNoFutura(control: AbstractControl<string>): ValidationErrors | null {
  return control.value && control.value > hoy() ? { fechaFutura: true } : null;
}

function pesosValidator(kgDelLote: (loteId: string | null) => number | null): ValidatorFn {
  return (grupo) => {
    const { loteId, pesoVerdeKg, pesoTostadoKg } = (grupo as FormularioTueste).getRawValue();
    const errores: ValidationErrors = {};
    const kgLote = kgDelLote(loteId);
    if (kgLote !== null && pesoVerdeKg !== null && pesoVerdeKg > kgLote) {
      errores['excedeLote'] = { kgLote };
    }
    if (pesoVerdeKg !== null && pesoTostadoKg !== null && pesoTostadoKg > pesoVerdeKg) {
      errores['tostadoMayorQueVerde'] = true;
    }
    return Object.keys(errores).length ? errores : null;
  };
}

export function crearFormularioTueste(kgDelLote: (loteId: string | null) => number | null) {
  return new FormGroup(
    {
      loteId: new FormControl<string | null>(null, Validators.required),
      nivel: new FormControl<EstiloTueste | null>(null, Validators.required),
      pesoVerdeKg: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0.01),
      ]),
      pesoTostadoKg: new FormControl<number | null>(null, [
        Validators.required,
        Validators.min(0.01),
      ]),
      fecha: new FormControl(hoy(), {
        nonNullable: true,
        validators: [Validators.required, fechaNoFutura],
      }),
      notas: new FormControl('', { nonNullable: true, validators: Validators.maxLength(300) }),
    },
    { validators: pesosValidator(kgDelLote) },
  );
}

export type FormularioTueste = ReturnType<typeof crearFormularioTueste>;

const porcentaje = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 1 });

const kilos = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 2 });

// Mensajes de los pesos; el popup de edición de Mis tostados muestra los mismos
export function errorPesoVerde(formulario: FormularioTueste): string | null {
  const control = formulario.controls.pesoVerdeKg;
  if (!control.touched) {
    return null;
  }
  if (control.hasError('required')) {
    return 'Ingresá el peso verde.';
  }
  if (control.hasError('min')) {
    return 'El peso tiene que ser mayor que 0.';
  }
  const exceso = formulario.getError('excedeLote');
  if (exceso) {
    return `El lote tiene ${kilos.format(exceso.kgLote)} kg; el peso verde no puede ser mayor.`;
  }
  return null;
}

export function errorPesoTostado(formulario: FormularioTueste): string | null {
  const control = formulario.controls.pesoTostadoKg;
  if (!control.touched) {
    return null;
  }
  if (control.hasError('required')) {
    return 'Ingresá el peso tostado.';
  }
  if (control.hasError('min')) {
    return 'El peso tiene que ser mayor que 0.';
  }
  if (formulario.hasError('tostadoMayorQueVerde')) {
    return 'El peso tostado no puede ser mayor al peso verde.';
  }
  return null;
}

// Crear y editar tueste comparten pantalla; la ruta de edición trae el id del tueste
@Component({
  selector: 'app-formulario-tueste',
  imports: [MenuLateralComponent, ReactiveFormsModule],
  templateUrl: './formulario-tueste.component.html',
  styleUrls: ['./campos-tueste.css', './formulario-tueste.component.css'],
  host: { '[attr.data-theme]': 'tema()' },
})
export class FormularioTuesteComponent {
  private readonly dashboard = inject(DashboardTostadorService);
  private readonly tuesteService = inject(TuesteService);
  private readonly router = inject(Router);

  protected readonly tema = this.dashboard.tema;

  private readonly ruta = inject(ActivatedRoute).snapshot;
  private readonly tuesteId = this.ruta.paramMap.get('id');
  protected readonly modoEdicion = this.tuesteId !== null;

  protected readonly niveles = ESTILOS_TUESTE;
  protected readonly lotes = signal<LoteConKgPorTostar[]>([]);
  private readonly errorApiPesoVerde = signal<string | null>(null);
  private readonly errorApiPesoTostado = signal<string | null>(null);
  protected readonly errorApi = signal<string | null>(null);

  protected readonly formulario = crearFormularioTueste(
    (loteId) => this.lotes().find((l) => l.id === loteId)?.kgPorTostar ?? null,
  );

  private readonly valores = toSignal(
    this.formulario.valueChanges.pipe(map(() => this.formulario.getRawValue())),
    { initialValue: this.formulario.getRawValue() },
  );

  protected readonly merma = computed(() => {
    const { pesoVerdeKg, pesoTostadoKg } = this.valores();
    return calcularMerma(pesoVerdeKg, pesoTostadoKg);
  });

  protected readonly guardado = signal<Tueste | null>(null);
  protected readonly noEncontrado = signal(false);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  protected readonly hoy = hoy();
  protected readonly porcentaje = porcentaje;
  protected readonly kilos = kilos;

  constructor() {
    if (this.tuesteId) {
      this.tuesteService.obtener(this.tuesteId).subscribe((encontrado) => {
        if (!encontrado) {
          this.noEncontrado.set(true);
          return;
        }
        const { tueste, lote } = encontrado;
        this.lotes.set([lote]);
        this.formulario.setValue({
          loteId: tueste.loteId,
          nivel: tueste.nivel,
          pesoVerdeKg: tueste.pesoVerdeKg,
          pesoTostadoKg: tueste.pesoTostadoKg,
          fecha: tueste.fecha,
          notas: tueste.notas ?? '',
        });
        this.formulario.controls.loteId.disable();
      });
      return;
    }
    this.tuesteService.lotesConKgPorTostar().subscribe((lotes) => {
      this.lotes.set(lotes);
      const loteId = this.ruta.queryParamMap.get('lote');
      if (loteId && lotes.some((l) => l.id === loteId)) {
        this.formulario.controls.loteId.setValue(loteId);
      }
    });
  }

  protected origen(lote: LoteConKgPorTostar): string {
    return lote.proceso ? `${lote.variedad}, ${lote.proceso}` : lote.variedad;
  }

  protected invalido(control: AbstractControl): boolean {
    return control.invalid && control.touched;
  }

  protected errorPesoVerde(): string | null {
    return errorPesoVerde(this.formulario) ?? this.errorApiPesoVerde();
  }

  protected errorPesoTostado(): string | null {
    return errorPesoTostado(this.formulario) ?? this.errorApiPesoTostado();
  }

  protected guardar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      return;
    }
    this.errorApiPesoVerde.set(null);
    this.errorApiPesoTostado.set(null);
    this.errorApi.set(null);
    const { loteId, nivel, pesoVerdeKg, pesoTostadoKg, fecha, notas } =
      this.formulario.getRawValue();
    const datos = {
      nivel: nivel!,
      pesoVerdeKg: pesoVerdeKg!,
      pesoTostadoKg: pesoTostadoKg!,
      fecha,
      notas: notas.trim() || null,
    };
    const guardar$ = this.tuesteId
      ? this.tuesteService.actualizar(this.tuesteId, datos)
      : this.tuesteService.registrar({ ...datos, loteId: loteId! });
    guardar$.subscribe({
      next: (tueste) => {
        this.guardado.set(tueste);
        this.dialogo().nativeElement.showModal();
      },
      error: (error: ErrorTueste) => {
        this.errorApiPesoVerde.set(error.errores['pesoVerdeKg'] ?? null);
        this.errorApiPesoTostado.set(error.errores['pesoTostadoKg'] ?? null);
        this.errorApi.set(Object.keys(error.errores).length ? null : error.mensaje);
      },
    });
  }

  protected cerrarDialogo(): void {
    this.dialogo().nativeElement.close();
    if (!this.modoEdicion) {
      this.formulario.reset();
    }
    this.guardado.set(null);
  }

  protected alCancelarDialogo(evento: Event): void {
    evento.preventDefault();
    this.cerrarDialogo();
  }

  protected irAMisTostados(): void {
    this.router.navigateByUrl(RUTA_MIS_TOSTADOS);
  }
}
