import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

import { CafeteriaService } from '../../../core/services/cafeteria.service';
import { CuentaService } from '../../../core/services/cuenta.service';
import { TemaService } from '../../../core/services/tema.service';
import { armarBloques, NAV_CUENTA, rutaActiva, TITULO_ROL } from './menu-lateral.config';

function iniciales(nombreCompleto: string): string {
  return nombreCompleto
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}

@Component({
  selector: 'app-menu-lateral',
  imports: [NgTemplateOutlet, RouterLink],
  templateUrl: './menu-lateral.component.html',
  styleUrl: './menu-lateral.component.css',
})
export class MenuLateralComponent {
  private readonly router = inject(Router);
  private readonly cuenta = inject(CuentaService).cuenta;
  private readonly cafeteria = toSignal(inject(CafeteriaService).obtenerActual());

  protected readonly tema = inject(TemaService).tema;
  protected readonly navCuenta = NAV_CUENTA;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly bloques = computed(() =>
    armarBloques(this.cuenta().roles, this.cafeteria() !== undefined),
  );

  protected readonly variosRoles = computed(() => this.bloques().length > 1);

  protected readonly activa = computed(() =>
    rutaActiva(this.url(), [...this.bloques().flatMap((bloque) => bloque.items), ...NAV_CUENTA]),
  );

  protected readonly perfil = computed(() => {
    const cuenta = this.cuenta();
    return {
      iniciales: iniciales(cuenta.nombreCompleto),
      nombreCompleto: cuenta.nombreCompleto,
      roles: this.bloques()
        .map((bloque) => TITULO_ROL[bloque.rol])
        .join(' · '),
    };
  });
}
