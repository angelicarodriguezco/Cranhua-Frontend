import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  ESTILOS_CAFE,
  EstiloCafe,
  VOLUMENES_MENSUALES,
  VolumenMensual,
} from '../../../../core/models/cafeteria.model';

export function crearFormularioPreferencias() {
  return new FormGroup({
    volumenMensual: new FormControl<VolumenMensual | null>(null, Validators.required),
    estilos: new FormControl<EstiloCafe[]>([], {
      nonNullable: true,
      validators: Validators.required,
    }),
  });
}

export type FormularioPreferencias = ReturnType<typeof crearFormularioPreferencias>;

@Component({
  selector: 'app-preferencias-cafeteria',
  imports: [ReactiveFormsModule],
  templateUrl: './preferencias-cafeteria.component.html',
  styleUrls: ['../paso-cafeteria.css', './preferencias-cafeteria.component.css'],
})
export class PreferenciasCafeteriaComponent {
  readonly formulario = input.required<FormularioPreferencias>();
  readonly editando = input(false);
  readonly guardar = output();
  readonly atras = output();

  protected readonly volumenes = VOLUMENES_MENSUALES;
  protected readonly estilos = ESTILOS_CAFE;

  protected invalido(campo: keyof FormularioPreferencias['controls']): boolean {
    const control = this.formulario().controls[campo];
    return control.invalid && control.touched;
  }

  protected seleccionado(estilo: EstiloCafe): boolean {
    return this.formulario().controls.estilos.value.includes(estilo);
  }

  protected alternar(estilo: EstiloCafe): void {
    const control = this.formulario().controls.estilos;
    const actuales = control.value;
    control.setValue(
      ESTILOS_CAFE.filter((e) => (e === estilo ? !actuales.includes(e) : actuales.includes(e))),
    );
    control.markAsTouched();
  }

  protected enviar(): void {
    this.formulario().markAllAsTouched();
    this.guardar.emit();
  }
}
