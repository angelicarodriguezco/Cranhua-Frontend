import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  cuerpoCrearPedido,
  historialPedidosDesdeApi,
  pedidoDesdeApi,
} from '../mappers/pedido.mapper';
import {
  CambiarEstadoPedidoRequestApi,
  ErrorPedido,
  HistorialPedidos,
  HistorialPedidosApi,
  NuevoPedido,
  Pedido,
  PedidoApi,
} from '../models/pedido.model';

const opcionesCredenciales = { withCredentials: true as const };
const ERROR_PEDIDO = 'No pudimos enviar el pedido. Intentá de nuevo.';
const ERROR_ESTADO = 'No pudimos actualizar el pedido. Intentá de nuevo.';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly http = inject(HttpClient);

  private get base(): string {
    return `${environment.apiUrl}/api/pedidos`;
  }

  listar(): Observable<HistorialPedidos> {
    return this.http
      .get<HistorialPedidosApi>(this.base, opcionesCredenciales)
      .pipe(map(historialPedidosDesdeApi));
  }

  crear(nuevo: NuevoPedido): Observable<Pedido> {
    return this.http
      .post<PedidoApi>(this.base, cuerpoCrearPedido(nuevo), opcionesCredenciales)
      .pipe(
        map(pedidoDesdeApi),
        catchError((error: HttpErrorResponse) =>
          throwError(() => this.errorDe(error, ERROR_PEDIDO)),
        ),
      );
  }

  marcarRecibido(id: string): Observable<Pedido> {
    return this.cambiarEstado(id, { estado: 'ENTREGADO' });
  }

  cancelar(id: string): Observable<Pedido> {
    return this.cambiarEstado(id, { estado: 'CANCELADO' });
  }

  private cambiarEstado(id: string, cuerpo: CambiarEstadoPedidoRequestApi): Observable<Pedido> {
    return this.http
      .patch<PedidoApi>(`${this.base}/${encodeURIComponent(id)}`, cuerpo, opcionesCredenciales)
      .pipe(
        map(pedidoDesdeApi),
        catchError((error: HttpErrorResponse) =>
          throwError(() => this.errorDe(error, ERROR_ESTADO)),
        ),
      );
  }

  private errorDe(error: HttpErrorResponse, generico: string): ErrorPedido {
    if ([400, 403, 404].includes(error.status)) {
      return {
        mensaje: error.error?.mensaje ?? generico,
        errores: error.error?.errores ?? {},
      };
    }
    return { mensaje: generico, errores: {} };
  }
}
