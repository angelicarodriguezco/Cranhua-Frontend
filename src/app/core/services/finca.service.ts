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
import { CANTONES } from '../mocks/finca.mock';
import {
  Canton,
  Coordenada,
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
import { distanciaKm } from '../../shared/utils/geo';
import { SesionService } from './sesion.service';

// Más lejos que esto de la cabecera más cercana se considera fuera de los cantones de ejemplo
const DISTANCIA_MAXIMA_CANTON_KM = 25;

const ERROR_REGISTRO = 'No pudimos registrar la finca. Intentá de nuevo.';
const ERROR_DUENO = 'No pudimos agregar a ese dueño. Intentá de nuevo.';

const opcionesCredenciales = { withCredentials: true as const };

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

@Injectable({ providedIn: 'root' })
export class FincaService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);

  private get base(): string {
    return `${environment.apiUrl}/api/fincas`;
  }

  private aFinca(api: FincaResponseApi): Finca {
    return fincaDesdeApi(api, this.sesion.usuario().id);
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
    return this.http.post<FincaResponseApi>(this.base, cuerpo, opcionesCredenciales).pipe(
      map((api): ResultadoRegistro => ({ registrada: true, finca: this.aFinca(api) })),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          return of<ResultadoRegistro>({
            registrada: false,
            conflicto: error.error.conflicto,
            mensaje: error.error.mensaje,
          });
        }
        const fallo: ErrorRegistroFinca =
          error.status === 400
            ? {
                mensaje: error.error?.mensaje ?? ERROR_REGISTRO,
                errores: error.error?.errores ?? {},
              }
            : { mensaje: ERROR_REGISTRO, errores: {} };
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

  // Pendiente: el backend todavía no tiene DELETE /api/fincas/{id}
  eliminar(id: string): Observable<boolean> {
    return of(id.length > 0);
  }

  cantonDe(punto: Coordenada): Canton | null {
    let masCercano: Canton | null = null;
    let menorDistancia = DISTANCIA_MAXIMA_CANTON_KM;
    for (const canton of CANTONES) {
      const distancia = distanciaKm(punto, canton.cabecera);
      if (distancia < menorDistancia) {
        masCercano = canton;
        menorDistancia = distancia;
      }
    }
    return masCercano;
  }

  buscarCanton(nombre: string): Canton | undefined {
    const buscado = normalizar(nombre);
    return (
      CANTONES.find((c) => normalizar(c.nombre) === buscado) ??
      CANTONES.find((c) => normalizar(c.nombre).startsWith(buscado))
    );
  }
}
