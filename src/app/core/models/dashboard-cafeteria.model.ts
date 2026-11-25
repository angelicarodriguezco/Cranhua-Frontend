import { EstadoPedido, PedidoApi } from './pedido.model';

export interface IndicadoresCafeteria {
  cafeRecibidoKg: number;
  pedidosActivos: number;
  tostadoresActivos: number;
}

export interface PedidoRecienteCafeteria {
  id: string;
  tostador: string;
  kilos: number;
  fecha: string;
  estado: EstadoPedido;
}

export interface ResumenDashboardCafeteria {
  indicadores: IndicadoresCafeteria;
  pedidosRecientes: PedidoRecienteCafeteria[];
}

export interface DashboardCafeteriaApi {
  indicadores: IndicadoresCafeteria;
  pedidosRecientes: PedidoApi[];
}
