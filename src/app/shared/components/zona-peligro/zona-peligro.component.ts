import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-zona-peligro',
  templateUrl: './zona-peligro.component.html',
  styleUrl: './zona-peligro.component.css',
})
export class ZonaPeligroComponent {
  readonly titulo = input('Zona de peligro');
  readonly descripcion = input(
    'Esta acción no se puede deshacer. Se eliminará el registro de forma permanente.',
  );
  readonly etiquetaBoton = input('Eliminar');

  readonly eliminar = output<void>();

  protected onEliminar(): void {
    this.eliminar.emit();
  }
}
