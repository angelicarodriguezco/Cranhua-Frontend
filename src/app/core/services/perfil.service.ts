import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { PERFIL_EJEMPLO } from '../mocks/perfil.mock';
import { PerfilUsuario } from '../models/perfil.model';

function clonarPerfil(perfil: PerfilUsuario): PerfilUsuario {
  return { ...perfil, redes: perfil.redes.map((r) => ({ ...r })) };
}

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private perfil: PerfilUsuario | null = clonarPerfil(PERFIL_EJEMPLO);

  obtener(): Observable<PerfilUsuario | null> {
    return of(this.perfil ? clonarPerfil(this.perfil) : null);
  }

  actualizar(perfil: PerfilUsuario): Observable<PerfilUsuario> {
    this.perfil = clonarPerfil(perfil);
    return of(clonarPerfil(perfil));
  }

  eliminarCuenta(): Observable<boolean> {
    const existia = this.perfil !== null;
    this.perfil = null;
    return of(existia);
  }
}
