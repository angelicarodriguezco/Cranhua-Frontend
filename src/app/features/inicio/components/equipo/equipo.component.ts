import { Component } from '@angular/core';

@Component({
  selector: 'app-equipo',
  templateUrl: './equipo.component.html',
  styleUrl: './equipo.component.css',
})
export class EquipoComponent {
  readonly miembros = [
    {
      iniciales: 'CH',
      nombre: 'Chris Andy Huang Ramírez',
      rol: 'Coordinador de Desarrollo',
    },
    {
      iniciales: 'JC',
      nombre: 'José Darío Chaves López',
      rol: 'Coordinador General',
    },
    {
      iniciales: 'MR',
      nombre: 'María Angélica Rodríguez Coto',
      rol: 'Coordinadora de Soporte',
    },
    {
      iniciales: 'SJ',
      nombre: 'Sebastián Herrera Jiménez',
      rol: 'Coordinador de Calidad',
    },
  ];
}
