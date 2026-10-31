import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TemaDashboard } from '../../../../core/models/dashboard-cafetalero.model';
import { PerfilTostadorSidebar } from '../../../../core/models/dashboard-tostador.model';

export type IconoNavTostador =
  | 'home'
  | 'explorar'
  | 'solicitudes'
  | 'tostados'
  | 'negocio'
  | 'perfil';

export interface ItemNavTostador {
  etiqueta: string;
  ruta: string;
  icono: IconoNavTostador;
  exacto?: boolean;
}

export const NAV_PRINCIPAL_TOSTADOR: ItemNavTostador[] = [
  { etiqueta: 'Dashboard', ruta: '/tostador/dashboard', icono: 'home', exacto: true },
  { etiqueta: 'Explorar cosechas', ruta: '/tostador/cosechas', icono: 'explorar' },
  { etiqueta: 'Mis solicitudes', ruta: '/tostador/solicitudes', icono: 'solicitudes' },
  { etiqueta: 'Mis tostados', ruta: '/tostador/tostados', icono: 'tostados' },
  { etiqueta: 'Mi negocio', ruta: '/tostador/negocio', icono: 'negocio' },
];

export const NAV_SECUNDARIO_TOSTADOR: ItemNavTostador[] = [
  { etiqueta: 'Perfil y ajustes', ruta: '/perfil', icono: 'perfil' },
];

// Mismo aspecto que el menú del cafetalero; solo cambian las opciones
@Component({
  selector: 'app-menu-lateral-tostador',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-lateral-tostador.component.html',
  styleUrl:
    '../../../dashboard-cafetalero/components/menu-lateral-cafetalero/menu-lateral-cafetalero.component.css',
})
export class MenuLateralTostadorComponent {
  readonly perfil = input.required<PerfilTostadorSidebar>();
  readonly tema = input<TemaDashboard>('oscuro');

  readonly alternarTema = output<void>();

  protected readonly navPrincipal = NAV_PRINCIPAL_TOSTADOR;
  protected readonly navSecundario = NAV_SECUNDARIO_TOSTADOR;
}
