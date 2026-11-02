import { Component, input, output } from '@angular/core';

// Compartida: CP3-24 pide el mismo estilo para "Eliminar cosecha" y Mi negocio
@Component({
  selector: 'app-zona-peligro',
  templateUrl: './zona-peligro.component.html',
  styleUrl: './zona-peligro.component.css',
})
export class ZonaPeligroComponent {
  readonly descripcion = input.required<string>();
  readonly accion = input.required<string>();
  readonly confirmar = output<void>();
}
