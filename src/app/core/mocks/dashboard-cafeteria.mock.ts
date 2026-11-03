import {
  IndicadoresCafeteria,
  PedidoRecienteCafeteria,
  PerfilCafeteriaSidebar,
  ResumenDashboardCafeteria,
} from '../models/dashboard-cafeteria.model';

export const INDICADORES_CAFETERIA: IndicadoresCafeteria = {
  cafeRecibidoKg: 42,
  pedidosActivos: 5,
  tostadoresActivos: 3,
};

export const PEDIDOS_RECIENTES_CAFETERIA: PedidoRecienteCafeteria[] = [
  {
    id: 'pedido-volcan-20',
    tostador: 'Tostaduría Volcán',
    kilos: 20,
    fecha: '2026-03-10',
    estado: 'Entregado',
  },
  {
    id: 'pedido-cerro-15',
    tostador: 'Café del Cerro',
    kilos: 15,
    fecha: '2026-03-02',
    estado: 'Entregado',
  },
  {
    id: 'pedido-volcan-10',
    tostador: 'Tostaduría Volcán',
    kilos: 10,
    fecha: '2026-02-18',
    estado: 'Entregado',
  },
  {
    id: 'pedido-grano-8',
    tostador: 'Grano y Fuego',
    kilos: 8,
    fecha: '2026-02-05',
    estado: 'En camino',
  },
];

export const PERFIL_CAFETERIA_SIDEBAR: PerfilCafeteriaSidebar = {
  iniciales: 'AS',
  nombreCompleto: 'Andrés Solano',
  rol: 'Cafetería - Café Brumas',
};

export const RESUMEN_DASHBOARD_CAFETERIA: ResumenDashboardCafeteria = {
  indicadores: INDICADORES_CAFETERIA,
  pedidosRecientes: PEDIDOS_RECIENTES_CAFETERIA,
  perfilSidebar: PERFIL_CAFETERIA_SIDEBAR,
};
