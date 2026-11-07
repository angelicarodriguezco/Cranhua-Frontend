import { Injectable, signal } from '@angular/core';

import { CUENTA_ACTUAL } from '../mocks/cuenta.mock';
import { Cuenta } from '../models/cuenta.model';

// Cuenta y roles del usuario. Cuando se conecte el backend, se llena con GET /api/cuenta.
@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly cuentaActual = signal<Cuenta>(CUENTA_ACTUAL);

  readonly cuenta = this.cuentaActual.asReadonly();

  establecerCuenta(cuenta: Cuenta): void {
    this.cuentaActual.set(cuenta);
  }
}
