import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { SesionService } from '../../../core/services/sesion.service';
import { iniciales, nombreCorto } from '../../utils/formato';

interface Opcion {
  ruta: string;
  texto: string;
  /** Trazo de un ícono de 24×24 */
  icono: string;
}

const PRINCIPALES: Opcion[] = [
  { ruta: '/dashboard', texto: 'Dashboard', icono: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3v-10.5Z' },
  {
    ruta: '/fincas',
    texto: 'Mis fincas',
    icono: 'M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4Zm0 0v13.5m6-11v13.5',
  },
  {
    ruta: '/cosechas/registrar',
    texto: 'Registrar cosecha',
    icono: 'M12 21v-9m0 0C12 8 9 5 4 5c0 4 3 7 8 7Zm0 0c0-3.5 2.5-6 7-6 0 3.5-2.5 6-7 6Z',
  },
  {
    ruta: '/historial',
    texto: 'Historial',
    icono: 'M3 12a9 9 0 1 0 2.6-6.4L3 8.2M3 3v5.2h5.2M12 7v5l3.5 2',
  },
];

const CUENTA: Opcion[] = [
  {
    ruta: '/perfil',
    texto: 'Perfil y ajustes',
    icono:
      'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM12 2.5l2 2.4 3.1-.4.9 3 2.8 1.5-1.2 2.9 1.2 2.9-2.8 1.5-.9 3-3.1-.4-2 2.4-2-2.4-3.1.4-.9-3-2.8-1.5 1.2-2.9-1.2-2.9 2.8-1.5.9-3 3.1.4 2-2.4Z',
  },
  // Mientras no exista el login real, cerrar sesión solo lleva a la pantalla de ingreso
  {
    ruta: '/iniciar-sesion',
    texto: 'Cerrar sesión',
    icono: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9',
  },
];

@Component({
  selector: 'app-menu-cafetalero',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-cafetalero.component.html',
  styleUrl: './menu-cafetalero.component.css',
})
export class MenuCafetaleroComponent {
  private readonly usuario = inject(SesionService).usuario;

  protected readonly grupos = [PRINCIPALES, CUENTA];
  protected readonly nombre = computed(() => nombreCorto(this.usuario()));
  protected readonly iniciales = computed(() => iniciales(this.usuario()));
}
