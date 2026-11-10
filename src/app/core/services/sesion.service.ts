import { Injectable, signal } from '@angular/core';

import { USUARIO_ACTUAL } from '../mocks/finca.mock';
import { Usuario } from '../models/finca.model';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly usuarioActual = signal<Usuario | null>(USUARIO_ACTUAL);

  readonly usuario = this.usuarioActual.asReadonly();

  iniciarSesion(usuario: Usuario): void {
    this.usuarioActual.set(usuario);
  }

  cerrarSesion(): void {
    this.usuarioActual.set(null);
  }
}
