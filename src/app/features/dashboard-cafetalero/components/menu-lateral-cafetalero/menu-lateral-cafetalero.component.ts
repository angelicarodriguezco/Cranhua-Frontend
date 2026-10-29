import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { PerfilCafetaleroSidebar, TemaDashboard } from '../../../../core/models/dashboard-cafetalero.model';

export type IconoNavCafetalero =
  | 'home'
  | 'fincas'
  | 'cosecha'
  | 'historial'
  | 'perfil'
  | 'logout';

export interface ItemNavCafetalero {
  etiqueta: string;
  ruta: string;
  icono: IconoNavCafetalero;
  exacto?: boolean;
}

export const NAV_PRINCIPAL_CAFETALERO: ItemNavCafetalero[] = [
  { etiqueta: 'Dashboard', ruta: '/dashboard', icono: 'home', exacto: true },
  { etiqueta: 'Mis fincas', ruta: '/mis-fincas', icono: 'fincas' },
  { etiqueta: 'Registrar cosecha', ruta: '/registrar-cosecha', icono: 'cosecha' },
  { etiqueta: 'Historial', ruta: '/historial', icono: 'historial' },
];

export const NAV_SECUNDARIO_CAFETALERO: ItemNavCafetalero[] = [
  { etiqueta: 'Perfil y ajustes', ruta: '/perfil', icono: 'perfil' },
  { etiqueta: 'Cerrar sesión', ruta: '/iniciar-sesion', icono: 'logout' },
];

@Component({
  selector: 'app-menu-lateral-cafetalero',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-lateral-cafetalero.component.html',
  styleUrl: './menu-lateral-cafetalero.component.css',
})
export class MenuLateralCafetaleroComponent {
  readonly perfil = input.required<PerfilCafetaleroSidebar>();
  readonly tema = input<TemaDashboard>('oscuro');

  readonly alternarTema = output<void>();

  protected readonly navPrincipal = NAV_PRINCIPAL_CAFETALERO;
  protected readonly navSecundario = NAV_SECUNDARIO_CAFETALERO;
}
