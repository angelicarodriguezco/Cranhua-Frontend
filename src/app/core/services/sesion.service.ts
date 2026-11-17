import { Injectable, signal } from '@angular/core';

import { Usuario } from '../models/finca.model';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly usuarioActual = signal<Usuario | null>(null);

  readonly usuario = this.usuarioActual.asReadonly();

  iniciarSesion(usuario: Usuario): void {
    this.usuarioActual.set(usuario);
  }

  cerrarSesion(): void {
    this.usuarioActual.set(null);
  }
}
