import { Component } from '@angular/core';

@Component({
  selector: 'app-como-funciona',
  templateUrl: './como-funciona.component.html',
  styleUrl: './como-funciona.component.css',
})
export class ComoFuncionaComponent {
  readonly pasos = [
    {
      num: '01',
      titulo: 'Registrar',
      texto: 'El cafetalero registra su finca, cosecha y proceso en la plataforma.',
    },
    {
      num: '02',
      titulo: 'Tostar',
      texto:
        'El tostador explora cosechas disponibles, compra el lote y genera un código de trazabilidad único.',
    },
    {
      num: '03',
      titulo: 'Servir',
      texto:
        'La cafetería publica ese código junto al café que sirve a sus clientes.',
    },
    {
      num: '04',
      titulo: 'Escanear',
      texto:
        'El consumidor escanea el código y descubre la finca, el proceso y quién tostó su café.',
    },
  ];
}
