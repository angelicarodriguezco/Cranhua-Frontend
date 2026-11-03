import { Component, ElementRef, computed, inject, output, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { map } from 'rxjs';

import { ESTILOS_TUESTE } from '../../../../core/models/negocio-tueste.model';
import { LoteComprado, Tueste } from '../../../../core/models/tueste.model';
import { TuesteService, calcularMerma } from '../../../../core/services/tueste.service';
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

  protected readonly niveles = ESTILOS_TUESTE;
  protected readonly formulario = crearFormularioTueste(() => this.lote()?.kg ?? null);

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

  abrir(tueste: Tueste, lote: LoteComprado): void {
    this.tueste.set(tueste);
    this.lote.set(lote);
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
    return errorPesoVerde(this.formulario);
  }

  protected errorPesoTostado(): string | null {
    return errorPesoTostado(this.formulario);
  }

  protected guardar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      return;
    }
    const { nivel, pesoVerdeKg, pesoTostadoKg, fecha, notas } = this.formulario.getRawValue();
    this.tuesteService
      .actualizar(this.tueste()!.id, {
        nivel: nivel!,
        pesoVerdeKg: pesoVerdeKg!,
        pesoTostadoKg: pesoTostadoKg!,
        fecha,
        notas: notas.trim() || null,
      })
      .subscribe((tueste) => {
        this.cerrar();
        this.guardado.emit(tueste);
      });
  }

  protected cerrar(): void {
    this.dialogo().nativeElement.close();
  }

  // Esc: no todos los navegadores disparan después el evento close, así que se cierra a mano
  protected alCancelar(evento: Event): void {
    evento.preventDefault();
    this.cerrar();
  }
}
