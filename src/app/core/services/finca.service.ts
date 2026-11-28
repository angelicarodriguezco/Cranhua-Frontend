import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  catchError,
  concatMap,
  from,
  map,
  of,
  reduce,
  switchMap,
  throwError,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CambiosFinca,
  DuenoFallido,
  ErrorRegistroFinca,
  Finca,
  FincaResponseApi,
  NuevaFinca,
  ResultadoAgregarDueno,
  ResultadoRegistro,
  ResultadoRegistroConDuenos,
} from '../models/finca.model';
import { fincaDesdeApi } from '../utils/finca-desde-api';
import { SesionService } from './sesion.service';

const ERROR_REGISTRO = 'No pudimos registrar la finca. Intentá de nuevo.';
const ERROR_ACTUALIZAR = 'No pudimos guardar los cambios de la finca. Intentá de nuevo.';
const ERROR_ELIMINAR = 'No pudimos eliminar la finca. Intentá de nuevo.';
const ERROR_DUENO = 'No pudimos agregar a ese dueño. Intentá de nuevo.';

const opcionesCredenciales = { withCredentials: true as const };

@Injectable({ providedIn: 'root' })
export class FincaService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);

  private get base(): string {
    return `${environment.apiUrl}/api/fincas`;
  }

  private aFinca(api: FincaResponseApi): Finca {
    return fincaDesdeApi(api, this.sesion.usuario()?.id ?? '');
  }

  misFincas(): Observable<Finca[]> {
    return this.http
      .get<FincaResponseApi[]>(this.base, opcionesCredenciales)
      .pipe(map((fincas) => fincas.map((f) => this.aFinca(f))));
  }

  obtener(id: string): Observable<Finca> {
    return this.http
      .get<FincaResponseApi>(`${this.base}/${id}`, opcionesCredenciales)
      .pipe(map((f) => this.aFinca(f)));
  }

  registrar(nueva: NuevaFinca): Observable<ResultadoRegistro> {
    const cuerpo = {
      nombre: nueva.nombre,
      descripcion: nueva.descripcion,
      zonaCafetalera: nueva.zona,
      perimetro: nueva.perimetro,
      ubicacion: nueva.ubicacion,
      canton: nueva.canton?.nombre ?? '',
      provincia: nueva.canton?.provincia ?? '',
    };
    return this.http
      .post<FincaResponseApi>(this.base, cuerpo, opcionesCredenciales)
      .pipe(this.resultadoGuardado(ERROR_REGISTRO));
  }

  actualizar(id: string, cambios: CambiosFinca): Observable<ResultadoRegistro> {
    return this.http
      .patch<FincaResponseApi>(`${this.base}/${id}`, cambios, opcionesCredenciales)
      .pipe(this.resultadoGuardado(ERROR_ACTUALIZAR));
  }

  // El 409 de superposición no es un error: trae la finca en conflicto para mostrarla en el mapa
  private resultadoGuardado(porDefecto: string) {
    return (respuesta: Observable<FincaResponseApi>): Observable<ResultadoRegistro> =>
      respuesta.pipe(
        map((api): ResultadoRegistro => ({ registrada: true, finca: this.aFinca(api) })),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 409 && error.error?.conflicto) {
            return of<ResultadoRegistro>({
              registrada: false,
              conflicto: error.error.conflicto,
              mensaje: error.error.mensaje,
            });
          }
          const conMensaje = [400, 403, 404].includes(error.status);
          const fallo: ErrorRegistroFinca = {
            mensaje: (conMensaje && error.error?.mensaje) || porDefecto,
            errores: (error.status === 400 && error.error?.errores) || {},
            estado: error.status,
          };
          return throwError(() => fallo);
        }),
      );
  }

  // Los dueños se agregan uno por uno después de crear la finca; si alguno falla la finca queda
  registrarConDuenos(nueva: NuevaFinca, correos: string[]): Observable<ResultadoRegistroConDuenos> {
    return this.registrar(nueva).pipe(
      switchMap((resultado) => {
        if (!resultado.registrada) {
          return of(resultado);
        }
        const inicial = {
          registrada: true as const,
          finca: resultado.finca,
          duenosFallidos: [] as DuenoFallido[],
        };
        return from(correos).pipe(
          concatMap((correo) =>
            this.agregarDueno(resultado.finca.id, correo).pipe(map((r) => ({ correo, r }))),
          ),
          reduce(
            (acumulado, { correo, r }) =>
              r.agregado
                ? { ...acumulado, finca: r.finca }
                : {
                    ...acumulado,
                    duenosFallidos: [...acumulado.duenosFallidos, { correo, mensaje: r.mensaje }],
                  },
            inicial,
          ),
        );
      }),
    );
  }

  agregarDueno(fincaId: string, correo: string): Observable<ResultadoAgregarDueno> {
    return this.http
      .post<FincaResponseApi>(`${this.base}/${fincaId}/duenos`, { correo }, opcionesCredenciales)
      .pipe(
        map((api): ResultadoAgregarDueno => ({ agregado: true, finca: this.aFinca(api) })),
        catchError((error: HttpErrorResponse) =>
          of<ResultadoAgregarDueno>({
            agregado: false,
            mensaje:
              (error.status === 404 || error.status === 409) && error.error?.mensaje
                ? error.error.mensaje
                : ERROR_DUENO,
          }),
        ),
      );
  }

  quitarDueno(fincaId: string, cuentaId: string): Observable<Finca> {
    return this.http
      .delete<FincaResponseApi>(`${this.base}/${fincaId}/duenos/${cuentaId}`, opcionesCredenciales)
      .pipe(map((f) => this.aFinca(f)));
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, opcionesCredenciales).pipe(
      catchError((error: HttpErrorResponse) =>
        throwError(
          (): ErrorRegistroFinca => ({
            mensaje: error.error?.mensaje ?? ERROR_ELIMINAR,
            errores: {},
            estado: error.status,
          }),
        ),
      ),
    );
  }
}
