import { Component, inject } from '@angular/core';

import { CantonService } from '../../../core/services/canton.service';

// Muestra el contenido solo cuando el catálogo ya cargó; mientras tanto, la carga o el error
@Component({
  selector: 'app-estado-cantones',
  templateUrl: './estado-cantones.component.html',
  styleUrl: './estado-cantones.component.css',
})
export class EstadoCantonesComponent {
  protected readonly cantones = inject(CantonService);
}
