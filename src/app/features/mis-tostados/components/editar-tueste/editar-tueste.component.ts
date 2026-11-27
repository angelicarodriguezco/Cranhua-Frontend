import { Component, ElementRef, computed, inject, output, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { map } from 'rxjs';

import { ESTILOS_TUESTE } from '../../../../core/models/negocio-tueste.model';
import { ErrorTueste, LoteComprado, Tueste } from '../../../../core/models/tueste.model';
import {
  TuesteService,
  calcularMerma,
  kgPorTostar,
} from '../../../../core/services/tueste.service';
import {
  crearFormularioTueste,
  errorPesoTostado,
  errorPesoVerde,
  hoy,
} from '../../../formulario-tueste/formulario-tueste.component';

const porcentaje = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 1 });

// Edición rápida desde el panel de tuestes. Usa el mismo formulario y validaciones que la
// pantalla de edición (CP3-86); el lote no se puede cambiar.
@Component({
  selector: 'app-editar-tueste',
  imports: [ReactiveFormsModule],
  templateUrl: './editar-tueste.component.html',
  styleUrls: ['../../../formulario-tueste/campos-tueste.css', './editar-tueste.component.css'],
})
export class EditarTuesteComponent {
  private readonly tuesteService = inject(TuesteService);

  readonly guardado = output<Tueste>();

  protected readonly tueste = signal<Tueste | null>(null);
  protected readonly lote = signal<LoteComprado | null>(null);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');
  private readonly errorApiPesoVerde = signal<string | null>(null);
  private readonly errorApiPesoTostado = signal<string | null>(null);
  protected readonly errorApi = signal<string | null>(null);

  protected readonly niveles = ESTILOS_TUESTE;
  // Kg del lote sin contar este tueste, igual que la pantalla de edición
  private readonly kgDisponible = signal<number | null>(null);
  protected readonly formulario = crearFormularioTueste(() => this.kgDisponible());

  private readonly valores = toSignal(
    this.formulario.valueChanges.pipe(map(() => this.formulario.getRawValue())),
    { initialValue: this.formulario.getRawValue() },
  );

  protected readonly merma = computed(() => {
    const { pesoVerdeKg, pesoTostadoKg } = this.valores();
    return calcularMerma(pesoVerdeKg, pesoTostadoKg);
  });

  protected readonly hoy = hoy();
  protected readonly porcentaje = porcentaje;

  abrir(tueste: Tueste, lote: LoteComprado, tuestesDelLote: Tueste[]): void {
    this.tueste.set(tueste);
    this.lote.set(lote);
    this.kgDisponible.set(
      kgPorTostar(
        lote,
        tuestesDelLote.filter((t) => t.id !== tueste.id),
      ),
    );
    this.errorApiPesoVerde.set(null);
    this.errorApiPesoTostado.set(null);
    this.errorApi.set(null);
    this.formulario.reset({
      loteId: tueste.loteId,
      nivel: tueste.nivel,
      pesoVerdeKg: tueste.pesoVerdeKg,
      pesoTostadoKg: tueste.pesoTostadoKg,
      fecha: tueste.fecha,
      notas: tueste.notas ?? '',
    });
    this.formulario.controls.loteId.disable();
    this.dialogo().nativeElement.showModal();
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
    const { nivel, pesoVerdeKg, pesoTostadoKg, fecha, notas } = this.formulario.getRawValue();
    this.tuesteService
      .actualizar(this.tueste()!.id, {
        nivel: nivel!,
        pesoVerdeKg: pesoVerdeKg!,
        pesoTostadoKg: pesoTostadoKg!,
        fecha,
        notas: notas.trim() || null,
      })
      .subscribe({
        next: (tueste) => {
          this.cerrar();
          this.guardado.emit(tueste);
        },
        error: (error: ErrorTueste) => {
          this.errorApiPesoVerde.set(error.errores['pesoVerdeKg'] ?? null);
          this.errorApiPesoTostado.set(error.errores['pesoTostadoKg'] ?? null);
          this.errorApi.set(Object.keys(error.errores).length ? null : error.mensaje);
        },
      });
  }

  protected cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  protected alCancelar(evento: Event): void {
    evento.preventDefault();
    this.cerrar();
  }
}
