import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ActualizarPerfilDatos,
  aActualizarCuentaRequest,
  mapearCuentaResponseAPerfil,
} from '../mappers/cuenta.mapper';
import { CuentaResponseApi } from '../models/auth.model';
import { PerfilUsuario } from '../models/perfil.model';

const opcionesCredenciales = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private readonly http = inject(HttpClient);

  private get base(): string {
    return `${environment.apiUrl}/api/cuenta`;
  }

  obtener(): Observable<PerfilUsuario> {
    return this.http
      .get<CuentaResponseApi>(this.base, opcionesCredenciales)
      .pipe(map(mapearCuentaResponseAPerfil));
  }

  actualizar(datos: ActualizarPerfilDatos): Observable<PerfilUsuario> {
    return this.http
      .patch<CuentaResponseApi>(this.base, aActualizarCuentaRequest(datos), opcionesCredenciales)
      .pipe(map(mapearCuentaResponseAPerfil));
  }

  actualizarFoto(archivo: File): Observable<PerfilUsuario> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http
      .post<CuentaResponseApi>(`${this.base}/foto`, formData, opcionesCredenciales)
      .pipe(map(mapearCuentaResponseAPerfil));
  }

  actualizarBanner(archivo: File): Observable<PerfilUsuario> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http
      .post<CuentaResponseApi>(`${this.base}/banner`, formData, opcionesCredenciales)
      .pipe(map(mapearCuentaResponseAPerfil));
  }

  eliminarCuenta(): Observable<void> {
    return this.http.delete<void>(this.base, opcionesCredenciales);
  }
}
