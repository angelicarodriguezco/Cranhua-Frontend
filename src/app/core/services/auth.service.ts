import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CuentaResponseApi,
  IniciarSesionGoogleRequest,
  IniciarSesionRequest,
  RecuperarContrasenaRequest,
  RegistroGoogleRequest,
  RegistroRequest,
  RestablecerContrasenaRequest,
  ROL_DESDE_API,
  VerificarCodigoRequest,
} from '../models/auth.model';
import { Cuenta } from '../models/cuenta.model';
import { usuarioDesdeNombreCompleto } from '../utils/nombre-usuario';
import { CuentaService } from './cuenta.service';
import { SesionService } from './sesion.service';

const opcionesCredenciales = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly cuentaService = inject(CuentaService);
  private readonly sesionService = inject(SesionService);

  private get base(): string {
    return `${environment.apiUrl}/api/auth`;
  }

  registrar(request: RegistroRequest): Observable<CuentaResponseApi> {
    return this.http.post<CuentaResponseApi>(
      `${this.base}/registro`,
      request,
      opcionesCredenciales,
    );
  }

  registrarConGoogle(request: RegistroGoogleRequest): Observable<CuentaResponseApi> {
    return this.http.post<CuentaResponseApi>(
      `${this.base}/registro/google`,
      request,
      opcionesCredenciales,
    );
  }

  iniciarSesion(request: IniciarSesionRequest): Observable<CuentaResponseApi> {
    return this.http.post<CuentaResponseApi>(
      `${this.base}/iniciarSesion`,
      request,
      opcionesCredenciales,
    );
  }

  iniciarSesionConGoogle(request: IniciarSesionGoogleRequest): Observable<CuentaResponseApi> {
    return this.http.post<CuentaResponseApi>(
      `${this.base}/iniciarSesion/google`,
      request,
      opcionesCredenciales,
    );
  }

  solicitarRecuperacion(request: RecuperarContrasenaRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/recuperar`, request);
  }

  verificarCodigo(request: VerificarCodigoRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/verificarCodigo`, request);
  }

  // withCredentials para que el navegador aplique el borrado de la cookie de sesión
  restablecerContrasena(request: RestablecerContrasenaRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/restablecer`, request, opcionesCredenciales);
  }

  aplicarSesion(cuentaApi: CuentaResponseApi): void {
    const cuenta: Cuenta = {
      id: cuentaApi.id,
      nombreCompleto: cuentaApi.nombreCompleto,
      correo: cuentaApi.correo,
      roles: cuentaApi.roles.map((rol) => ROL_DESDE_API[rol]),
    };
    this.cuentaService.establecerCuenta(cuenta);
    this.sesionService.iniciarSesion(
      usuarioDesdeNombreCompleto(cuentaApi.id, cuentaApi.nombreCompleto, cuentaApi.correo),
    );
  }
}
