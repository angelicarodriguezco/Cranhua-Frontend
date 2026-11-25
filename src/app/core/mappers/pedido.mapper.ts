import {
  DashboardCafeteriaApi,
  ResumenDashboardCafeteria,
} from '../models/dashboard-cafeteria.model';
import {
  CrearPedidoRequestApi,
  EstadoPedido,
  EstadoPedidoApi,
  HistorialPedidos,
  HistorialPedidosApi,
  NuevoPedido,
  Pedido,
  PedidoApi,
} from '../models/pedido.model';
import { fechaLocalDesdeInstant } from './solicitud.mapper';

const ESTADO_DESDE_API: Record<EstadoPedidoApi, EstadoPedido> = {
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export function estadoPedidoDesdeApi(estado: EstadoPedidoApi): EstadoPedido {
  return ESTADO_DESDE_API[estado];
}

export function pedidoDesdeApi(api: PedidoApi): Pedido {
  return {
    id: api.id,
    tostador: api.tostador,
    kilos: Number(api.cantidadKg),
    fecha: fechaLocalDesdeInstant(api.pedidoEn),
    estado: estadoPedidoDesdeApi(api.estado),
  };
}

export function historialPedidosDesdeApi(api: HistorialPedidosApi): HistorialPedidos {
  return {
    indicadores: {
      activos: api.indicadores.pedidosActivos,
      kgRecibidosMes: Number(api.indicadores.kgRecibidosEsteMes),
      tostadoresActivos: api.indicadores.tostadoresActivos,
    },
    pedidos: api.pedidos.map(pedidoDesdeApi),
  };
}

export function cuerpoCrearPedido(nuevo: NuevoPedido): CrearPedidoRequestApi {
  return { tuesteId: nuevo.tuesteId, cantidadKg: nuevo.kilos };
}

export function resumenDashboardCafeteriaDesdeApi(
  api: DashboardCafeteriaApi,
): ResumenDashboardCafeteria {
  return {
    indicadores: {
      cafeRecibidoKg: Number(api.indicadores.cafeRecibidoKg),
      pedidosActivos: api.indicadores.pedidosActivos,
      tostadoresActivos: api.indicadores.tostadoresActivos,
    },
    pedidosRecientes: api.pedidosRecientes.map(pedidoDesdeApi),
  };
}
