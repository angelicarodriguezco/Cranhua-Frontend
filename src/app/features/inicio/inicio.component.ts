import { Component } from '@angular/core';

import { PortadaComponent } from './components/portada/portada.component';
import { ProblemaComponent } from './components/problema/problema.component';
import { ComoFuncionaComponent } from './components/como-funciona/como-funciona.component';
import { NombreComponent } from './components/nombre/nombre.component';
import { EquipoComponent } from './components/equipo/equipo.component';
import { PieComponent } from './components/pie/pie.component';

@Component({
  selector: 'app-inicio',
  imports: [
    PortadaComponent,
    ProblemaComponent,
    ComoFuncionaComponent,
    NombreComponent,
    EquipoComponent,
    PieComponent,
  ],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {}
