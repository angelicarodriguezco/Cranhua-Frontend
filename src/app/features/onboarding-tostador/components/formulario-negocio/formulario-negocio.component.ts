import { Component, input, model, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  Canton,
  Coordenada,
  ESTILOS_TUESTE,
  EstiloTueste,
} from '../../../../core/models/negocio-tueste.model';
import { MapaUbicacionComponent } from '../mapa-ubicacion/mapa-ubicacion.component';

// 8 dígitos, con el código de país y los separadores opcionales
const TELEFONO = /^(\+?506[\s-]?)?\d{4}[\s-]?\d{4}$/;

export function crearFormularioNegocio() {
  return new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    descripcion: new FormControl('', { nonNullable: true, validators: Validators.maxLength(300) }),
    contacto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(TELEFONO)],
    }),
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    estilos: new FormControl<EstiloTueste[]>([], {
      nonNullable: true,
      validators: Validators.required,
    }),
  });
}

export type FormularioNegocio = ReturnType<typeof crearFormularioNegocio>;

type Campo = keyof FormularioNegocio['controls'];

@Component({
  selector: 'app-formulario-negocio',
  imports: [ReactiveFormsModule, MapaUbicacionComponent],
  templateUrl: './formulario-negocio.component.html',
  styleUrl: './formulario-negocio.component.css',
})
export class FormularioNegocioComponent {
  readonly formulario = input.required<FormularioNegocio>();
  readonly pin = model<Coordenada | null>(null);
  readonly canton = input<Canton | null>(null);
  readonly intentoGuardar = input(false);
  readonly editando = input(false);
  readonly guardar = output();
  readonly cancelar = output();

  protected readonly estilos = ESTILOS_TUESTE;

  protected invalido(campo: Campo): boolean {
    const control = this.formulario().controls[campo];
    return control.invalid && control.touched;
  }

  protected tieneError(campo: Campo, error: string): boolean {
    return this.invalido(campo) && this.formulario().controls[campo].hasError(error);
  }

  protected ubicacionInvalida(): boolean {
    return this.intentoGuardar() && !this.canton();
  }

  protected seleccionado(estilo: EstiloTueste): boolean {
    return this.formulario().controls.estilos.value.includes(estilo);
  }

  protected alternarEstilo(estilo: EstiloTueste): void {
    const control = this.formulario().controls.estilos;
    const quitar = control.value.includes(estilo);
    // Se recorre la lista completa para que el orden no dependa del orden de los clics
    control.setValue(
      ESTILOS_TUESTE.filter((e) => (e === estilo ? !quitar : control.value.includes(e))),
    );
    control.markAsTouched();
  }

  protected enviar(): void {
    this.formulario().markAllAsTouched();
    this.guardar.emit();
  }
}
