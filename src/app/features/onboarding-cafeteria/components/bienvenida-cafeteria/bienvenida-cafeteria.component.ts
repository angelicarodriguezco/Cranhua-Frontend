import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-bienvenida-cafeteria',
  templateUrl: './bienvenida-cafeteria.component.html',
  styleUrls: ['../paso-cafeteria.css', './bienvenida-cafeteria.component.css'],
})
export class BienvenidaCafeteriaComponent {
  readonly nombre = input.required<string>();
  readonly empezar = output();
}
