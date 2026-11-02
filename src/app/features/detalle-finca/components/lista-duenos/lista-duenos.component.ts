import { Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { Usuario } from '../../../../core/models/finca.model';
import { iniciales } from '../../../../shared/utils/formato';

@Component({
  selector: 'app-lista-duenos',
  imports: [ReactiveFormsModule],
  templateUrl: './lista-duenos.component.html',
  styleUrl: './lista-duenos.component.css',
})
export class ListaDuenosComponent {
  readonly duenos = input.required<Usuario[]>();
  readonly propietarioId = input.required<string>();
  /** Mensaje del último intento fallido de agregar un dueño */
  readonly error = input<string | null>(null);
  readonly agregar = output<string>();

  protected readonly correo = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  protected readonly iniciales = iniciales;

  constructor() {
    // Cuando llega la lista con el dueño nuevo se limpia el campo
    effect(() => {
      this.duenos();
      this.correo.reset();
    });
  }

  protected enviar(): void {
    if (this.correo.invalid) {
      this.correo.markAsTouched();
      return;
    }
    this.agregar.emit(this.correo.value);
  }
}
