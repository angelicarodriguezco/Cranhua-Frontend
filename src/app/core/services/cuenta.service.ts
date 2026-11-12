import { Injectable, signal } from '@angular/core';

import { CUENTA_ACTUAL } from '../mocks/cuenta.mock';
import { Cuenta } from '../models/cuenta.model';

@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly cuentaActual = signal<Cuenta | null>(CUENTA_ACTUAL);

  readonly cuenta = this.cuentaActual.asReadonly();

  establecerCuenta(cuenta: Cuenta): void {
    this.cuentaActual.set(cuenta);
  }

  limpiarCuenta(): void {
    this.cuentaActual.set(null);
  }
}
