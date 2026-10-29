import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-bienvenida-tostador',
  templateUrl: './bienvenida-tostador.component.html',
  styleUrl: './bienvenida-tostador.component.css',
})
export class BienvenidaTostadorComponent {
  readonly nombre = input.required<string>();
  readonly empezar = output();

  protected readonly inicial = computed(() => this.nombre().trim().charAt(0).toUpperCase());
}
