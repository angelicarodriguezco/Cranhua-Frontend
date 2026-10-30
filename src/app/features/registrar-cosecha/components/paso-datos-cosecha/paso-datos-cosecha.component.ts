import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

import {
  FincaCosechaOpcion,
  ProcesoBeneficiado,
  ProcesoReparto,
} from '../../../../core/models/cosecha.model';
import { CosechaService } from '../../../../core/services/cosecha.service';
import { fechasOrdenadasValidator } from '../../../../shared/validators/fechas-ordenadas.validator';
import { sumaPorcentajesValidator } from '../../../../shared/validators/suma-porcentajes.validator';

export interface DatosPasoCosecha {
  fincaId: string;
  variedad: string;
  alturaMsnm: number;
  cantidadTotalKg: number;
  fechaInicio: string;
  fechaFin: string;
  procesos: ProcesoReparto[];
}

export type FormularioProceso = FormGroup<{
  proceso: FormControl<string>;
  porcentaje: FormControl<number>;
}>;

export type FormularioDatosCosecha = FormGroup<{
  fincaId: FormControl<string>;
  variedad: FormControl<string>;
  alturaMsnm: FormControl<number | null>;
  cantidadTotalKg: FormControl<number | null>;
  fechaInicio: FormControl<string>;
  fechaFin: FormControl<string>;
  procesos: FormArray<FormularioProceso>;
}>;

export function crearGrupoProceso(inicial?: Partial<ProcesoReparto>): FormularioProceso {
  return new FormGroup({
    proceso: new FormControl(inicial?.proceso ?? '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    porcentaje: new FormControl(inicial?.porcentaje ?? 0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    }),
  });
}

export function crearFormularioDatosCosecha(
  inicial?: Partial<DatosPasoCosecha>,
): FormularioDatosCosecha {
  const filas =
    inicial?.procesos && inicial.procesos.length > 0
      ? inicial.procesos
      : [{ proceso: '', porcentaje: 100 }];

  return new FormGroup(
    {
      fincaId: new FormControl(inicial?.fincaId ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      variedad: new FormControl(inicial?.variedad ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      alturaMsnm: new FormControl<number | null>(inicial?.alturaMsnm ?? null, {
        validators: [Validators.required, Validators.min(0)],
      }),
      cantidadTotalKg: new FormControl<number | null>(inicial?.cantidadTotalKg ?? null, {
        validators: [Validators.required, Validators.min(0.01)],
      }),
      fechaInicio: new FormControl(inicial?.fechaInicio ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      fechaFin: new FormControl(inicial?.fechaFin ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      procesos: new FormArray(
        filas.map((fila) => crearGrupoProceso(fila)),
        {
          validators: [sumaPorcentajesValidator],
        },
      ),
    },
    { validators: [fechasOrdenadasValidator] },
  );
}

@Component({
  selector: 'app-paso-datos-cosecha',
  imports: [ReactiveFormsModule],
  templateUrl: './paso-datos-cosecha.component.html',
  styleUrl: './paso-datos-cosecha.component.css',
})
export class PasoDatosCosechaComponent {
  private readonly cosechaService = inject(CosechaService);

  readonly valorInicial = input<Partial<DatosPasoCosecha> | null>(null);

  readonly continuar = output<DatosPasoCosecha>();
  readonly cancelar = output<void>();

  protected readonly fincas: readonly FincaCosechaOpcion[] = this.cosechaService.fincas;
  protected readonly variedades: readonly string[] = this.cosechaService.variedades;
  protected readonly catalogoProcesos: readonly ProcesoBeneficiado[] =
    this.cosechaService.procesosBeneficiado;

  protected readonly formulario = crearFormularioDatosCosecha();
  protected readonly intentoContinuar = signal(false);

  private readonly procesosValue = toSignal(
    this.formulario.controls.procesos.valueChanges.pipe(
      startWith(this.formulario.controls.procesos.getRawValue()),
    ),
    { initialValue: this.formulario.controls.procesos.getRawValue() },
  );

  protected readonly sumaPorcentaje = computed(() =>
    this.procesosValue().reduce((acumulado, fila) => {
      const porcentaje =
        typeof fila.porcentaje === 'number' ? fila.porcentaje : Number(fila.porcentaje);
      return acumulado + (Number.isFinite(porcentaje) ? porcentaje : 0);
    }, 0),
  );

  protected readonly segmentosBarra = computed(() => {
    const colores = new Map(this.catalogoProcesos.map((p) => [p.nombre, p.color]));
    return this.procesosValue()
      .map((fila) => {
        const porcentaje =
          typeof fila.porcentaje === 'number' ? fila.porcentaje : Number(fila.porcentaje);
        const ancho = Number.isFinite(porcentaje) && porcentaje > 0 ? porcentaje : 0;
        return {
          proceso: fila.proceso || 'Sin proceso',
          porcentaje: ancho,
          color: colores.get(fila.proceso ?? '') ?? '#A57008',
        };
      })
      .filter((seg) => seg.porcentaje > 0);
  });

  protected readonly estadoReparto = computed(() => {
    const suma = this.sumaPorcentaje();
    if (suma === 100) {
      return 'completo' as const;
    }
    if (suma > 100) {
      return 'excedido' as const;
    }
    return 'incompleto' as const;
  });

  private claveValorAplicado: string | null = null;

  constructor() {
    this.precargarProcesoPorDefecto();

    effect(() => {
      const inicial = this.valorInicial();
      if (!inicial) {
        return;
      }
      const clave = JSON.stringify(inicial);
      if (clave === this.claveValorAplicado) {
        return;
      }
      this.claveValorAplicado = clave;
      this.aplicarValorInicial(inicial);
    });
  }

  protected get procesos(): FormArray<FormularioProceso> {
    return this.formulario.controls.procesos;
  }

  protected colorProceso(nombre: string | null | undefined): string {
    const encontrado = this.catalogoProcesos.find((p) => p.nombre === nombre);
    return encontrado?.color ?? '#A57008';
  }

  protected campoInvalido(
    nombre: 'fincaId' | 'variedad' | 'alturaMsnm' | 'cantidadTotalKg' | 'fechaInicio' | 'fechaFin',
  ): boolean {
    const control = this.formulario.controls[nombre];
    return control.invalid && (control.touched || this.intentoContinuar());
  }

  protected procesoInvalido(indice: number): boolean {
    const control = this.procesos.at(indice)?.controls.proceso;
    return !!control && control.invalid && (control.touched || this.intentoContinuar());
  }

  protected porcentajeInvalido(indice: number): boolean {
    const control = this.procesos.at(indice)?.controls.porcentaje;
    return !!control && control.invalid && (control.touched || this.intentoContinuar());
  }

  protected fechasInconsistentes(): boolean {
    return (
      this.formulario.hasError('fechasInconsistentes') &&
      (this.formulario.controls.fechaFin.touched || this.intentoContinuar())
    );
  }

  protected agregarProceso(): void {
    const restante = Math.max(0, 100 - this.sumaPorcentaje());
    const usado = new Set(this.procesos.controls.map((g) => g.controls.proceso.value));
    const sugerido =
      this.catalogoProcesos.find((p) => !usado.has(p.nombre))?.nombre ??
      this.catalogoProcesos[0]?.nombre ??
      '';
    this.procesos.push(crearGrupoProceso({ proceso: sugerido, porcentaje: restante }));
  }

  protected eliminarProceso(indice: number): void {
    if (this.procesos.length <= 1) {
      return;
    }
    this.procesos.removeAt(indice);
  }

  protected enviar(): void {
    this.intentoContinuar.set(true);
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      return;
    }

    const valor = this.formulario.getRawValue();
    this.continuar.emit({
      fincaId: valor.fincaId,
      variedad: valor.variedad,
      alturaMsnm: Number(valor.alturaMsnm),
      cantidadTotalKg: Number(valor.cantidadTotalKg),
      fechaInicio: valor.fechaInicio,
      fechaFin: valor.fechaFin,
      procesos: valor.procesos.map((fila) => ({
        proceso: fila.proceso,
        porcentaje: Number(fila.porcentaje),
      })),
    });
  }

  protected onCancelar(): void {
    this.cancelar.emit();
  }

  private aplicarValorInicial(inicial: Partial<DatosPasoCosecha>): void {
    this.formulario.patchValue({
      fincaId: inicial.fincaId ?? '',
      variedad: inicial.variedad ?? '',
      alturaMsnm: inicial.alturaMsnm ?? null,
      cantidadTotalKg: inicial.cantidadTotalKg ?? null,
      fechaInicio: inicial.fechaInicio ?? '',
      fechaFin: inicial.fechaFin ?? '',
    });

    const filas =
      inicial.procesos && inicial.procesos.length > 0
        ? inicial.procesos
        : [
            {
              proceso: this.catalogoProcesos[0]?.nombre ?? '',
              porcentaje: 100,
            },
          ];

    this.procesos.clear();
    for (const fila of filas) {
      this.procesos.push(crearGrupoProceso(fila));
    }
  }

  private precargarProcesoPorDefecto(): void {
    const primera = this.procesos.at(0);
    if (!primera || primera.controls.proceso.value) {
      return;
    }
    const nombre = this.catalogoProcesos[0]?.nombre;
    if (nombre) {
      primera.controls.proceso.setValue(nombre);
    }
  }
}
