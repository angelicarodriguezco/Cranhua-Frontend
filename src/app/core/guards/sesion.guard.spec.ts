import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { CUENTA_CAFETALERO_TOSTADOR, CUENTA_SOLO_CAFETALERO } from '../mocks/cuenta.mock';
import { CuentaService } from '../services/cuenta.service';
import { rolGuard, sesionGuard } from './sesion.guard';

describe('guards de sesión y rol', () => {
  let cuentaService: CuentaService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    cuentaService = TestBed.inject(CuentaService);
    router = TestBed.inject(Router);
  });

  function ejecutar(guard: CanActivateChildFn, url: string): ReturnType<CanActivateChildFn> {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
  }

  function destino(resultado: ReturnType<CanActivateChildFn>): string {
    expect(resultado).toBeInstanceOf(UrlTree);
    return router.serializeUrl(resultado as UrlTree);
  }

  describe('sesionGuard', () => {
    it('deja pasar con sesión', () => {
      cuentaService.establecerCuenta(CUENTA_SOLO_CAFETALERO);
      expect(ejecutar(sesionGuard, '/perfil')).toBeTrue();
    });

    it('sin sesión manda al login con la ruta pedida', () => {
      cuentaService.limpiarCuenta();
      expect(destino(ejecutar(sesionGuard, '/cafetalero/fincas/f-1'))).toBe(
        '/iniciar-sesion?volver=%2Fcafetalero%2Ffincas%2Ff-1',
      );
    });
  });

  describe('rolGuard', () => {
    it('deja pasar si la cuenta tiene el rol', () => {
      cuentaService.establecerCuenta(CUENTA_SOLO_CAFETALERO);
      expect(ejecutar(rolGuard('cafetalero'), '/cafetalero/dashboard')).toBeTrue();
    });

    it('una cuenta con varios roles abre las vistas de todos', () => {
      cuentaService.establecerCuenta(CUENTA_CAFETALERO_TOSTADOR);
      expect(ejecutar(rolGuard('cafetalero'), '/cafetalero/historial')).toBeTrue();
      expect(ejecutar(rolGuard('tostador'), '/tostador/negocio')).toBeTrue();
    });

    it('con rol incorrecto lleva al dashboard del rol que sí tiene', () => {
      cuentaService.establecerCuenta(CUENTA_SOLO_CAFETALERO);
      expect(destino(ejecutar(rolGuard('cafeteria'), '/cafeteria/pedidos'))).toBe(
        '/cafetalero/dashboard',
      );
    });

    it('sin sesión manda al login', () => {
      cuentaService.limpiarCuenta();
      expect(destino(ejecutar(rolGuard('tostador'), '/tostador/dashboard'))).toBe(
        '/iniciar-sesion?volver=%2Ftostador%2Fdashboard',
      );
    });
  });
});
