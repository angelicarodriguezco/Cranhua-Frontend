import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { PEDIDOS, fechaIso } from '../mocks/pedidos.mock';
import { EstadoPedido, IndicadoresPedidos, Pedido } from '../models/pedido.model';

export function calcularIndicadores(pedidos: Pedido[], hoy = new Date()): IndicadoresPedidos {
  const mesActual = fechaIso(hoy).slice(0, 7);
  return {
    activos: pedidos.filter((p) => p.estado === 'En camino').length,
    kgRecibidosMes: pedidos
      .filter((p) => p.fechaRecibido?.startsWith(mesActual))
      .reduce((total, p) => total + p.kilos, 0),
    // Un tostador al que solo se le cancelaron pedidos no cuenta como activo
    tostadoresActivos: new Set(
      pedidos.filter((p) => p.estado !== 'Cancelado').map((p) => p.tostador),
    ).size,
  };
}

// Simula el backend con datos en memoria; las firmas devuelven Observable para cambiarlo por HTTP
@Injectable({ providedIn: 'root' })
export class PedidosService {
  private pedidos: Pedido[] = PEDIDOS.map((p) => ({ ...p }));

  listar(): Observable<Pedido[]> {
    return of([...this.pedidos].sort((a, b) => b.fecha.localeCompare(a.fecha)));
  }

  marcarRecibido(id: string): Observable<Pedido> {
    return this.cerrar(id, 'Entregado');
  }

  cancelar(id: string): Observable<Pedido> {
    return this.cerrar(id, 'Cancelado');
  }

  // Solo un pedido en camino puede pasar a entregado o cancelado
  private cerrar(id: string, estado: Exclude<EstadoPedido, 'En camino'>): Observable<Pedido> {
    const pedido = this.pedidos.find((p) => p.id === id);
    if (!pedido || pedido.estado !== 'En camino') {
      throw new Error(`El pedido ${id} no está en camino`);
    }
    const actualizado: Pedido = {
      ...pedido,
      estado,
      fechaRecibido: estado === 'Entregado' ? fechaIso(new Date()) : null,
    };
    this.pedidos = this.pedidos.map((p) => (p.id === id ? actualizado : p));
    return of(actualizado);
  }
}
