import { Component } from '@angular/core';

@Component({
  selector: 'app-problema',
  templateUrl: './problema.component.html',
  styleUrl: './problema.component.css',
})
export class ProblemaComponent {
  readonly puntos = [
    {
      titulo: 'Información dispersa',
      texto:
        'Cada actor de la cadena guarda sus datos por separado, sin un registro compartido y confiable.',
    },
    {
      titulo: 'Poco reconocimiento',
      texto:
        'Los cafetaleros rara vez reciben crédito visible por la calidad de su cosecha una vez que sale de la finca.',
    },
    {
      titulo: 'Consumidor a ciegas',
      texto:
        'Quien compra el café no tiene forma sencilla de conocer el origen real de lo que está tomando.',
    },
  ];
}
