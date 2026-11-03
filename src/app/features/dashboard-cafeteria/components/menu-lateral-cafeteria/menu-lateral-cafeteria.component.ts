import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { TemaDashboard } from '../../../../core/models/dashboard-cafetalero.model';
import { PerfilCafeteriaSidebar } from '../../../../core/models/dashboard-cafeteria.model';

export type IconoNavCafeteria = 'home' | 'explorar' | 'pedidos' | 'cafeteria' | 'perfil' | 'logout';

export interface ItemNavCafeteria {
  etiqueta: string;
  ruta: string;
  icono: IconoNavCafeteria;
  exacto?: boolean;
}

export const NAV_PRINCIPAL_CAFETERIA: ItemNavCafeteria[] = [
  { etiqueta: 'Dashboard', ruta: '/cafeteria/dashboard', icono: 'home', exacto: true },
  { etiqueta: 'Explorar tostadores', ruta: '/cafeteria/explorar-tostadores', icono: 'explorar' },
  { etiqueta: 'Mis pedidos', ruta: '/cafeteria/pedidos', icono: 'pedidos' },
  { etiqueta: 'Mi cafetería', ruta: '/cafeteria/mi-cafeteria', icono: 'cafeteria' },
];

export const NAV_SECUNDARIO_CAFETERIA: ItemNavCafeteria[] = [
  { etiqueta: 'Perfil y ajustes', ruta: '/perfil', icono: 'perfil' },
  { etiqueta: 'Cerrar sesión', ruta: '/iniciar-sesion', icono: 'logout' },
];

@Component({
  selector: 'app-menu-lateral-cafeteria',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-lateral-cafeteria.component.html',
  styleUrl:
    '../../../dashboard-cafetalero/components/menu-lateral-cafetalero/menu-lateral-cafetalero.component.css',
})
export class MenuLateralCafeteriaComponent {
  readonly perfil = input.required<PerfilCafeteriaSidebar>();
  readonly tema = input<TemaDashboard>('oscuro');

  readonly alternarTema = output<void>();

  protected readonly navPrincipal = NAV_PRINCIPAL_CAFETERIA;
  protected readonly navSecundario = NAV_SECUNDARIO_CAFETERIA;
}
