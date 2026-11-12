import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Canton, ZONAS_CAFETALERAS, ZonaCafetalera } from '../../../../core/models/finca.model';

// Mismo formato que valida el backend
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function crearFormularioFinca() {
  return new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    descripcion: new FormControl('', { nonNullable: true, validators: Validators.maxLength(300) }),
    zona: new FormControl<ZonaCafetalera | null>(null),
  });
}

export type FormularioFinca = ReturnType<typeof crearFormularioFinca>;

@Component({
  selector: 'app-formulario-finca',
  imports: [ReactiveFormsModule],
  templateUrl: './formulario-finca.component.html',
  styleUrl: './formulario-finca.component.css',
})
export class FormularioFincaComponent {
  private injector = inject(Injector);

  readonly formulario = input.required<FormularioFinca>();
  readonly canton = input<Canton | null>(null);
  readonly hayPin = input(false);
  /** Error del perímetro; se muestra solo después de intentar guardar. */
  readonly errorPerimetro = input<string | null>(null);
  readonly intentoGuardar = input(false);
  readonly guardando = input(false);
  readonly erroresServidor = input<string[]>([]);
  /** Correos de los dueños adicionales; se agregan después de crear la finca. */
  readonly duenos = model<string[]>([]);
  readonly guardar = output();

  protected readonly zonas = ZONAS_CAFETALERAS;

  protected readonly agregandoDueno = signal(false);
  protected readonly correoDueno = new FormControl('', { nonNullable: true });
  protected readonly errorDueno = signal<string | null>(null);
  private readonly campoCorreo = viewChild<ElementRef<HTMLInputElement>>('campoCorreo');

  protected nombreInvalido(): boolean {
    const nombre = this.formulario().controls.nombre;
    return nombre.invalid && nombre.touched;
  }

  protected mostrarCampoDueno(): void {
    this.agregandoDueno.set(true);
    this.errorDueno.set(null);
    afterNextRender(() => this.campoCorreo()?.nativeElement.focus(), { injector: this.injector });
  }

  protected cancelarDueno(): void {
    this.agregandoDueno.set(false);
    this.correoDueno.reset();
    this.errorDueno.set(null);
  }

  protected agregarDueno(): void {
    const correo = this.correoDueno.value.trim();
    if (!FORMATO_CORREO.test(correo)) {
      this.errorDueno.set('Ingresá un correo válido.');
      return;
    }
    this.duenos.update((duenos) => [...duenos, correo]);
    this.cancelarDueno();
  }

  protected quitarDueno(indice: number): void {
    this.duenos.update((duenos) => duenos.filter((_, i) => i !== indice));
  }

  protected enviar(): void {
    this.formulario().markAllAsTouched();
    this.guardar.emit();
  }
}
