import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { PerfilCafeteriaSidebar } from '../../../../core/models/pedido.model';

export type IconoNavCafeteria = 'home' | 'explorar' | 'pedidos' | 'negocio' | 'perfil';

export interface ItemNavCafeteria {
  etiqueta: string;
  ruta: string;
  icono: IconoNavCafeteria;
  exacto?: boolean;
}

export const NAV_PRINCIPAL_CAFETERIA: ItemNavCafeteria[] = [
  { etiqueta: 'Dashboard', ruta: '/cafeteria/dashboard', icono: 'home', exacto: true },
  { etiqueta: 'Explorar tostadores', ruta: '/cafeteria/tostadores', icono: 'explorar' },
  { etiqueta: 'Mis pedidos', ruta: '/cafeteria/pedidos', icono: 'pedidos' },
  { etiqueta: 'Mi cafetería', ruta: '/cafeteria/mi-cafeteria', icono: 'negocio' },
];

export const NAV_SECUNDARIO_CAFETERIA: ItemNavCafeteria[] = [
  { etiqueta: 'Perfil y ajustes', ruta: '/perfil', icono: 'perfil' },
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

  protected readonly navPrincipal = NAV_PRINCIPAL_CAFETERIA;
  protected readonly navSecundario = NAV_SECUNDARIO_CAFETERIA;
}
