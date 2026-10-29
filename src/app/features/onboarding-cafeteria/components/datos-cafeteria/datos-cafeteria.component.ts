import { Component, computed, input, model, output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { CantonReferencia } from '../../../../core/models/cafeteria.model';
import { Coordenada } from '../../../../core/models/finca.model';
import { MapaCafeteriaComponent } from '../mapa-cafeteria/mapa-cafeteria.component';

// 8 dígitos de Costa Rica, con o sin +506 y separados por espacio o guion
const TELEFONO = /^(\+506[\s-]?)?\d{4}[\s-]?\d{4}$/;
// Validators.email acepta "a@b"; se exige un dominio con punto
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function obligatorio(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}

export function crearFormularioDatos() {
  return new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [obligatorio, Validators.maxLength(80)],
    }),
    contacto: new FormControl('', {
      nonNullable: true,
      validators: [obligatorio, Validators.maxLength(80)],
    }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(TELEFONO)],
    }),
    correo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(CORREO)],
    }),
    descripcion: new FormControl('', { nonNullable: true, validators: Validators.maxLength(300) }),
    horario: new FormControl('', { nonNullable: true, validators: Validators.maxLength(100) }),
  });
}

export type FormularioDatos = ReturnType<typeof crearFormularioDatos>;

@Component({
  selector: 'app-datos-cafeteria',
  imports: [ReactiveFormsModule, MapaCafeteriaComponent],
  templateUrl: './datos-cafeteria.component.html',
  styleUrls: ['../paso-cafeteria.css', './datos-cafeteria.component.css'],
})
export class DatosCafeteriaComponent {
  readonly formulario = input.required<FormularioDatos>();
  readonly canton = input<CantonReferencia | null>(null);
  readonly intentoContinuar = input(false);
  readonly pin = model<Coordenada | null>(null);
  readonly continuar = output();
  readonly atras = output();

  protected readonly ubicacion = computed(() => {
    const canton = this.canton();
    return canton ? `${canton.nombre}, ${canton.provincia}` : '';
  });
  protected readonly faltaPin = computed(() => this.intentoContinuar() && !this.pin());

  protected invalido(campo: keyof FormularioDatos['controls']): boolean {
    const control = this.formulario().controls[campo];
    return control.invalid && control.touched;
  }

  protected enviar(): void {
    this.formulario().markAllAsTouched();
    this.continuar.emit();
  }
}
