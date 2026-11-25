import { DashboardCafeteriaApi } from '../models/dashboard-cafeteria.model';
import { DetalleTostadorApi } from '../models/detalle-tostador.model';
import { HistorialPedidosApi, PedidoApi } from '../models/pedido.model';
import { TostadorExploracionApi } from '../models/tostador-disponible.model';

export function tostadorApi(cambios: Partial<TostadorExploracionApi> = {}): TostadorExploracionApi {
  return {
    id: 't-volcan',
    nombre: 'Tostaduría Volcán',
    canton: 'San José',
    provincia: 'San José',
    estilos: ['CLARO', 'MEDIO'],
    kgDisponibles: 85,
    ...cambios,
  };
}

export const TOSTADORES_API: TostadorExploracionApi[] = [
  tostadorApi(),
  tostadorApi({
    id: 't-cerro',
    nombre: 'Café del Cerro',
    canton: 'Tarrazú',
    estilos: ['OSCURO'],
    kgDisponibles: 0,
  }),
];

export function detalleTostadorApi(cambios: Partial<DetalleTostadorApi> = {}): DetalleTostadorApi {
  return {
    id: 't-volcan',
    nombre: 'Tostaduría Volcán',
    nombreContacto: 'Laura Mora',
    telefono: '+506 8888-1111',
    correo: 'laura@tostaduriavolcan.cr',
    descripcion: 'Tostado artesanal en pequeños lotes.',
    canton: 'San José',
    provincia: 'San José',
    estilos: ['CLARO', 'MEDIO'],
    portadaUrl: null,
    tuestes: [
      {
        id: 'tu-1',
        fincaOrigen: 'La Catalina',
        variedad: 'Caturra',
        nivel: 'CLARO',
        kgDisponibles: 60,
      },
      {
        id: 'tu-2',
        fincaOrigen: 'Monte Alto',
        variedad: 'Geisha',
        nivel: 'MEDIO',
        kgDisponibles: 25,
      },
      {
        id: 'tu-3',
        fincaOrigen: 'El Mirador',
        variedad: 'Catuaí',
        nivel: 'MEDIO',
        kgDisponibles: 12.5,
      },
    ],
    ...cambios,
  };
}

export function pedidoApi(cambios: Partial<PedidoApi> = {}): PedidoApi {
  return {
    id: 'p-1',
    tostador: 'Tostaduría Volcán',
    cantidadKg: 12,
    pedidoEn: '2026-11-20T12:00:00Z',
    estado: 'EN_CAMINO',
    ...cambios,
  };
}

export function historialApi(cambios: Partial<HistorialPedidosApi> = {}): HistorialPedidosApi {
  return {
    indicadores: { pedidosActivos: 1, kgRecibidosEsteMes: 15, tostadoresActivos: 2 },
    pedidos: [
      pedidoApi(),
      pedidoApi({
        id: 'p-cancelado',
        tostador: 'Grano y Fuego',
        cantidadKg: 8,
        pedidoEn: '2026-11-10T12:00:00Z',
        estado: 'CANCELADO',
      }),
      pedidoApi({
        id: 'p-viejo',
        tostador: 'Café del Cerro',
        cantidadKg: 15,
        pedidoEn: '2026-11-02T12:00:00Z',
        estado: 'ENTREGADO',
      }),
    ],
    ...cambios,
  };
}

export function dashboardApi(cambios: Partial<DashboardCafeteriaApi> = {}): DashboardCafeteriaApi {
  return {
    indicadores: { cafeRecibidoKg: 42, pedidosActivos: 5, tostadoresActivos: 3 },
    pedidosRecientes: [
      pedidoApi({ id: 'r-1', cantidadKg: 20, estado: 'ENTREGADO' }),
      pedidoApi({ id: 'r-2', tostador: 'Café del Cerro', cantidadKg: 8 }),
    ],
    ...cambios,
  };
}
