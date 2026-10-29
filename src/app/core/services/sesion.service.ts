import { Injectable, signal } from '@angular/core';

import { USUARIO_ACTUAL } from '../mocks/finca.mock';
import { Usuario } from '../models/finca.model';

// Única fuente del usuario que inició sesión. Mientras no exista el login arranca con el
// usuario de ejemplo; el login solo tiene que llamar a iniciarSesion con el usuario real.
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly usuarioActual = signal<Usuario>(USUARIO_ACTUAL);

  readonly usuario = this.usuarioActual.asReadonly();

  iniciarSesion(usuario: Usuario): void {
    this.usuarioActual.set(usuario);
  }
}
