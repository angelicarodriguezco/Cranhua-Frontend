export type EstadoPedido = 'En camino' | 'Entregado' | 'Cancelado';

export interface Pedido {
  id: string;
  tostador: string;
  kilos: number;
  /** yyyy-mm-dd en que se hizo el pedido */
  fecha: string;
  estado: EstadoPedido;
  /** yyyy-mm-dd en que la cafetería lo marcó como recibido; solo en los entregados */
  fechaRecibido: string | null;
}

export interface IndicadoresPedidos {
  activos: number;
  kgRecibidosMes: number;
  tostadoresActivos: number;
}

export interface PerfilCafeteriaSidebar {
  iniciales: string;
  nombreCompleto: string;
  rol: string;
}
