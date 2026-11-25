export type EstadoPedido = 'En camino' | 'Entregado' | 'Cancelado';

export interface Pedido {
  id: string;
  tostador: string;
  kilos: number;
  fecha: string;
  estado: EstadoPedido;
}

export interface IndicadoresPedidos {
  activos: number;
  kgRecibidosMes: number;
  tostadoresActivos: number;
}

export interface HistorialPedidos {
  indicadores: IndicadoresPedidos;
  pedidos: Pedido[];
}

export interface NuevoPedido {
  tuesteId: string;
  kilos: number;
}

export interface ErrorPedido {
  mensaje: string;
  errores: Record<string, string>;
}

export type EstadoPedidoApi = 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';

export interface PedidoApi {
  id: string;
  tostador: string;
  cantidadKg: number;
  pedidoEn: string;
  estado: EstadoPedidoApi;
}

export interface HistorialPedidosApi {
  indicadores: {
    pedidosActivos: number;
    kgRecibidosEsteMes: number;
    tostadoresActivos: number;
  };
  pedidos: PedidoApi[];
}

export interface CrearPedidoRequestApi {
  tuesteId: string;
  cantidadKg: number;
}

export interface CambiarEstadoPedidoRequestApi {
  estado: Exclude<EstadoPedidoApi, 'EN_CAMINO'>;
}
