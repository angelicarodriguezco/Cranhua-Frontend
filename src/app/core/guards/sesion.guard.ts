import { inject } from '@angular/core';
import { CanActivateChildFn, Router, UrlTree } from '@angular/router';

import { RolCuenta, RUTA_DASHBOARD_POR_ROL } from '../models/cuenta.model';
import { CuentaService } from '../services/cuenta.service';

export const RUTA_INICIAR_SESION = '/iniciar-sesion';

function irAlLogin(router: Router, url: string): UrlTree {
  return router.createUrlTree([RUTA_INICIAR_SESION], { queryParams: { volver: url } });
}

export const sesionGuard: CanActivateChildFn = (_ruta, estado) => {
  const router = inject(Router);
  return inject(CuentaService).cuenta() ? true : irAlLogin(router, estado.url);
};

export function rolGuard(rol: RolCuenta): CanActivateChildFn {
  return (_ruta, estado) => {
    const router = inject(Router);
    const cuenta = inject(CuentaService).cuenta();
    if (!cuenta) {
      return irAlLogin(router, estado.url);
    }
    if (cuenta.roles.includes(rol)) {
      return true;
    }
    const propio = cuenta.roles[0];
    return router.parseUrl(propio ? RUTA_DASHBOARD_POR_ROL[propio] : '/');
  };
}
