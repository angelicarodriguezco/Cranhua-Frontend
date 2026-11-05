import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { CafeteriaService } from '../services/cafeteria.service';

export const RUTA_REGISTRAR_CAFETERIA = '/cafeteria/registrar';
const RUTA_DASHBOARD_CAFETERIA = '/cafeteria/dashboard';

// Sin local registrado, las vistas de cafetería mandan a la pantalla de registro
export const conCafeteriaGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(CafeteriaService)
    .obtenerActual()
    .pipe(map((cafeteria) => (cafeteria ? true : router.parseUrl(RUTA_REGISTRAR_CAFETERIA))));
};

export const sinCafeteriaGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(CafeteriaService)
    .obtenerActual()
    .pipe(map((cafeteria) => (cafeteria ? router.parseUrl(RUTA_DASHBOARD_CAFETERIA) : true)));
};
