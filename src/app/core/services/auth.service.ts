import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, map, timeout } from 'rxjs';

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
const ESPERA_RESTAURAR_MS = 5000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly cuentaService = inject(CuentaService);
  private readonly sesionService = inject(SesionService);

  private get base(): string {
    return `${environment.apiUrl}/api/auth`;
  }

  registrar(request: RegistroRequest, foto?: File | null): Observable<CuentaResponseApi> {
    if (foto) {
      const formData = new FormData();
      formData.append('datos', new Blob([JSON.stringify(request)], { type: 'application/json' }));
      formData.append('foto', foto);
      return this.http.post<CuentaResponseApi>(
        `${this.base}/registro`,
        formData,
        opcionesCredenciales,
      );
    }

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
    return this.postSinCuerpo(`${this.base}/recuperar`, request);
  }

  verificarCodigo(request: VerificarCodigoRequest): Observable<void> {
    return this.postSinCuerpo(`${this.base}/verificarCodigo`, request);
  }

  restablecerContrasena(request: RestablecerContrasenaRequest): Observable<void> {
    return this.postSinCuerpo(`${this.base}/restablecer`, request, opcionesCredenciales);
  }

  private postSinCuerpo(
    url: string,
    body: unknown,
    opciones: { withCredentials?: boolean } = {},
  ): Observable<void> {
    return this.http
      .post(url, body, { ...opciones, responseType: 'text' })
      .pipe(map(() => undefined));
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

  cuentaActual(): Observable<CuentaResponseApi> {
    return this.http.get<CuentaResponseApi>(
      `${environment.apiUrl}/api/cuenta`,
      opcionesCredenciales,
    );
  }

  // Sin red o con timeout se arranca igual; solo un 401/403 confirma que no hay sesión
  async restaurarSesion(): Promise<void> {
    try {
      const cuenta = await firstValueFrom(this.cuentaActual().pipe(timeout(ESPERA_RESTAURAR_MS)));
      this.aplicarSesion(cuenta);
    } catch (error) {
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        this.limpiarSesion();
      }
    }
  }

  limpiarSesion(): void {
    this.cuentaService.limpiarCuenta();
    this.sesionService.cerrarSesion();
  }

  cerrarSesion(): void {
    this.limpiarSesion();
    this.postSinCuerpo(`${this.base}/cerrarSesion`, null, opcionesCredenciales).subscribe({
      error: () => undefined,
    });
  }
}
