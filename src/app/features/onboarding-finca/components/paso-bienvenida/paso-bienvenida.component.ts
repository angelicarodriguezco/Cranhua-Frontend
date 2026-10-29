import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paso-bienvenida',
  templateUrl: './paso-bienvenida.component.html',
  styleUrl: './paso-bienvenida.component.css',
})
export class PasoBienvenidaComponent {
  readonly nombre = input.required<string>();
  readonly empezar = output();

  protected readonly inicial = computed(() => this.nombre().trim().charAt(0).toUpperCase());
}
