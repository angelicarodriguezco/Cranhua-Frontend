import { RolCuenta } from '../../../core/models/cuenta.model';

export type IconoNav =
  | 'home'
  | 'fincas'
  | 'cosecha'
  | 'historial'
  | 'explorar'
  | 'solicitudes'
  | 'tostados'
  | 'negocio'
  | 'pedidos'
  | 'cafeteria'
  | 'registrar'
  | 'perfil'
  | 'logout';

export interface ItemNav {
  etiqueta: string;
  ruta: string;
  icono: IconoNav;
  exacto?: boolean;
  rutasRelacionadas?: string[];
}

export interface BloqueRol {
  rol: RolCuenta;
  titulo: string;
  items: ItemNav[];
}

export const ORDEN_ROLES: RolCuenta[] = ['cafetalero', 'tostador', 'cafeteria'];

export const TITULO_ROL: Record<RolCuenta, string> = {
  cafetalero: 'Cafetalero',
  tostador: 'Tostador',
  cafeteria: 'Cafetería',
};

export const NAV_POR_ROL: Record<RolCuenta, ItemNav[]> = {
  cafetalero: [
    { etiqueta: 'Dashboard', ruta: '/cafetalero/dashboard', icono: 'home', exacto: true },
    { etiqueta: 'Mis fincas', ruta: '/cafetalero/fincas', icono: 'fincas' },
    { etiqueta: 'Registrar cosecha', ruta: '/cafetalero/registrar-cosecha', icono: 'cosecha' },
    { etiqueta: 'Historial', ruta: '/cafetalero/historial', icono: 'historial' },
  ],
  tostador: [
    { etiqueta: 'Dashboard', ruta: '/tostador/dashboard', icono: 'home', exacto: true },
    { etiqueta: 'Explorar cosechas', ruta: '/tostador/cosechas', icono: 'explorar' },
    { etiqueta: 'Mis solicitudes', ruta: '/tostador/solicitudes', icono: 'solicitudes' },
    { etiqueta: 'Mis tostados', ruta: '/tostador/tostados', icono: 'tostados' },
    { etiqueta: 'Mi negocio', ruta: '/tostador/negocio', icono: 'negocio' },
  ],
  cafeteria: [
    { etiqueta: 'Dashboard', ruta: '/cafeteria/dashboard', icono: 'home', exacto: true },
    { etiqueta: 'Explorar tostadores', ruta: '/cafeteria/tostadores', icono: 'explorar' },
    { etiqueta: 'Mis pedidos', ruta: '/cafeteria/pedidos', icono: 'pedidos' },
    {
      etiqueta: 'Mi cafetería',
      ruta: '/cafeteria/mi-cafeteria',
      icono: 'cafeteria',
      rutasRelacionadas: ['/cafeteria/menu'],
    },
  ],
};

// CP3-91: con rol cafetería pero sin cafetería activa, el bloque solo ofrece registrarla
export const NAV_CAFETERIA_SIN_REGISTRO: ItemNav[] = [
  { etiqueta: 'Registrar cafetería', ruta: '/cafeteria/registrar', icono: 'registrar' },
];

export const NAV_CUENTA: ItemNav[] = [
  { etiqueta: 'Perfil y ajustes', ruta: '/perfil', icono: 'perfil' },
  { etiqueta: 'Cerrar sesión', ruta: '/iniciar-sesion', icono: 'logout' },
];

export function armarBloques(roles: readonly RolCuenta[], tieneCafeteria: boolean): BloqueRol[] {
  return ORDEN_ROLES.filter((rol) => roles.includes(rol)).map((rol) => ({
    rol,
    titulo: TITULO_ROL[rol],
    items: rol === 'cafeteria' && !tieneCafeteria ? NAV_CAFETERIA_SIN_REGISTRO : NAV_POR_ROL[rol],
  }));
}

function coincide(url: string, ruta: string, exacto: boolean): boolean {
  return url === ruta || (!exacto && url.startsWith(`${ruta}/`));
}

// Devuelve la ruta de la única sección activa: la coincidencia más larga gana
export function rutaActiva(url: string, items: readonly ItemNav[]): string | null {
  const limpia = url.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  let mejor: { ruta: string; largo: number } | null = null;

  for (const item of items) {
    const candidatas = [item.ruta, ...(item.rutasRelacionadas ?? [])];
    for (const candidata of candidatas) {
      if (
        coincide(limpia, candidata, item.exacto === true) &&
        candidata.length > (mejor?.largo ?? -1)
      ) {
        mejor = { ruta: item.ruta, largo: candidata.length };
      }
    }
  }
  return mejor?.ruta ?? null;
}
