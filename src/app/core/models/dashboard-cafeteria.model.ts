export interface IndicadoresCafeteria {
  cafeRecibidoKg: number;
  pedidosActivos: number;
  tostadoresActivos: number;
}

export type EstadoPedidoCafeteria = 'Entregado' | 'En camino';

export interface PedidoRecienteCafeteria {
  id: string;
  tostador: string;
  kilos: number;
  fecha: string;
  estado: EstadoPedidoCafeteria;
}

export interface PerfilCafeteriaSidebar {
  iniciales: string;
  nombreCompleto: string;
  rol: string;
}

export interface ResumenDashboardCafeteria {
  indicadores: IndicadoresCafeteria;
  pedidosRecientes: PedidoRecienteCafeteria[];
  perfilSidebar: PerfilCafeteriaSidebar;
}
