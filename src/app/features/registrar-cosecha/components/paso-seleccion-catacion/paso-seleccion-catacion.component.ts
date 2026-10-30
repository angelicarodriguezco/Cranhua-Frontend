import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';

export interface DatosPasoSeleccion {
  pesoAntesKg: number;
  pesoTrasSeleccionKg: number;
  separoCaracolillo: boolean | null;
  pesoCaracolilloKg: number | null;
  puntajeSca: number | null;
  notasCatacion: string | null;
}

export type FormularioSeleccionCatacion = FormGroup<{
  pesoAntesKg: FormControl<number | null>;
  pesoTrasSeleccionKg: FormControl<number | null>;
  separoCaracolillo: FormControl<'' | 'si' | 'no'>;
  pesoCaracolilloKg: FormControl<number | null>;
  puntajeSca: FormControl<number | null>;
  notasCatacion: FormControl<string>;
}>;

const pesoCaracolilloCondicionalValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const grupo = control as FormularioSeleccionCatacion;
  const separo = grupo.controls.separoCaracolillo.value;
  const peso = grupo.controls.pesoCaracolilloKg;

  if (separo !== 'si') {
    return null;
  }

  const valor = peso.value;
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) {
    return { pesoCaracolilloRequerido: true };
  }
  if (Number(valor) < 0) {
    return { pesoCaracolilloInvalido: true };
  }
  return null;
};

export function crearFormularioSeleccionCatacion(
  inicial?: Partial<DatosPasoSeleccion>,
): FormularioSeleccionCatacion {
  let separo: '' | 'si' | 'no' = '';
  if (inicial?.separoCaracolillo === true) {
    separo = 'si';
  } else if (inicial?.separoCaracolillo === false) {
    separo = 'no';
  }

  return new FormGroup(
    {
      pesoAntesKg: new FormControl<number | null>(inicial?.pesoAntesKg ?? null, {
        validators: [Validators.required, Validators.min(0)],
      }),
      pesoTrasSeleccionKg: new FormControl<number | null>(inicial?.pesoTrasSeleccionKg ?? null, {
        validators: [Validators.required, Validators.min(0)],
      }),
      separoCaracolillo: new FormControl<'' | 'si' | 'no'>(separo, {
        nonNullable: true,
      }),
      pesoCaracolilloKg: new FormControl<number | null>(inicial?.pesoCaracolilloKg ?? null),
      puntajeSca: new FormControl<number | null>(inicial?.puntajeSca ?? null, {
        validators: [Validators.min(0), Validators.max(100)],
      }),
      notasCatacion: new FormControl(inicial?.notasCatacion ?? '', {
        nonNullable: true,
      }),
    },
    { validators: [pesoCaracolilloCondicionalValidator] },
  );
}

export function calcularMermaPorcentaje(antes: number, despues: number): number {
  if (!Number.isFinite(antes) || antes <= 0) {
    return 0;
  }
  if (!Number.isFinite(despues)) {
    return 0;
  }
  return ((antes - despues) / antes) * 100;
}

@Component({
  selector: 'app-paso-seleccion-catacion',
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './paso-seleccion-catacion.component.html',
  styleUrl: './paso-seleccion-catacion.component.css',
})
export class PasoSeleccionCatacionComponent {
  readonly valorInicial = input<Partial<DatosPasoSeleccion> | null>(null);
  readonly pesoAntesSugerido = input<number | null>(null);

  readonly guardar = output<DatosPasoSeleccion>();
  readonly atras = output<void>();

  protected readonly formulario = crearFormularioSeleccionCatacion();
  protected readonly intentoGuardar = signal(false);

  private readonly valoresForm = toSignal(
    this.formulario.valueChanges.pipe(
      startWith(this.formulario.getRawValue()),
      map(() => this.formulario.getRawValue()),
    ),
    { initialValue: this.formulario.getRawValue() },
  );

  protected readonly mermaPorcentaje = computed(() => {
    const valor = this.valoresForm();
    const antes = Number(valor.pesoAntesKg);
    const despues = Number(valor.pesoTrasSeleccionKg);
    return calcularMermaPorcentaje(antes, despues);
  });

  protected readonly muestraPesoCaracolillo = computed(
    () => this.valoresForm().separoCaracolillo === 'si',
  );

  private claveValorAplicado: string | null = null;
  private pesoSugeridoAplicado: number | null = null;

  constructor() {
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

    effect(() => {
      const sugerido = this.pesoAntesSugerido();
      if (sugerido === null || sugerido === undefined) {
        return;
      }
      if (this.pesoSugeridoAplicado === sugerido) {
        return;
      }
      const control = this.formulario.controls.pesoAntesKg;
      if (control.value === null || control.value === this.pesoSugeridoAplicado) {
        control.setValue(sugerido);
      }
      this.pesoSugeridoAplicado = sugerido;
    });
  }

  protected campoInvalido(
    nombre: 'pesoAntesKg' | 'pesoTrasSeleccionKg' | 'pesoCaracolilloKg' | 'puntajeSca',
  ): boolean {
    const control = this.formulario.controls[nombre];
    const tocado = control.touched || this.intentoGuardar();

    if (nombre === 'pesoCaracolilloKg') {
      return (
        tocado &&
        this.muestraPesoCaracolillo() &&
        (this.formulario.hasError('pesoCaracolilloRequerido') ||
          this.formulario.hasError('pesoCaracolilloInvalido') ||
          control.invalid)
      );
    }

    return control.invalid && tocado;
  }

  protected enviar(): void {
    this.intentoGuardar.set(true);
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      return;
    }

    const valor = this.formulario.getRawValue();
    let separo: boolean | null = null;
    if (valor.separoCaracolillo === 'si') {
      separo = true;
    } else if (valor.separoCaracolillo === 'no') {
      separo = false;
    }

    const notas = valor.notasCatacion.trim();

    this.guardar.emit({
      pesoAntesKg: Number(valor.pesoAntesKg),
      pesoTrasSeleccionKg: Number(valor.pesoTrasSeleccionKg),
      separoCaracolillo: separo,
      pesoCaracolilloKg:
        separo === true && valor.pesoCaracolilloKg !== null
          ? Number(valor.pesoCaracolilloKg)
          : null,
      puntajeSca: valor.puntajeSca !== null ? Number(valor.puntajeSca) : null,
      notasCatacion: notas.length > 0 ? notas : null,
    });
  }

  protected onAtras(): void {
    this.atras.emit();
  }

  private aplicarValorInicial(inicial: Partial<DatosPasoSeleccion>): void {
    let separo: '' | 'si' | 'no' = '';
    if (inicial.separoCaracolillo === true) {
      separo = 'si';
    } else if (inicial.separoCaracolillo === false) {
      separo = 'no';
    }

    this.formulario.patchValue({
      pesoAntesKg: inicial.pesoAntesKg ?? null,
      pesoTrasSeleccionKg: inicial.pesoTrasSeleccionKg ?? null,
      separoCaracolillo: separo,
      pesoCaracolilloKg: inicial.pesoCaracolilloKg ?? null,
      puntajeSca: inicial.puntajeSca ?? null,
      notasCatacion: inicial.notasCatacion ?? '',
    });
  }
}
