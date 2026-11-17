import { TestBed } from '@angular/core/testing';

import { CUENTA_ACTUAL } from '../mocks/cuenta.mock';
import { USUARIO_ACTUAL } from '../mocks/finca.mock';
import { Cuenta } from '../models/cuenta.model';
import { CuentaService } from '../services/cuenta.service';
import { SesionService } from '../services/sesion.service';

// Los servicios arrancan sin sesión; los specs que prueban vistas privadas la inician acá
export function conSesionDeEjemplo(cuenta: Cuenta = CUENTA_ACTUAL): void {
  TestBed.inject(CuentaService).establecerCuenta(cuenta);
  TestBed.inject(SesionService).iniciarSesion(USUARIO_ACTUAL);
}
