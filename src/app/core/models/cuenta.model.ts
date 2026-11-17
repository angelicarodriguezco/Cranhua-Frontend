export type RolCuenta = 'cafetalero' | 'tostador' | 'cafeteria';

export interface Cuenta {
  id: string;
  nombreCompleto: string;
  correo: string;
  roles: RolCuenta[];
}

export const RUTA_DASHBOARD_POR_ROL: Record<RolCuenta, string> = {
  cafetalero: '/cafetalero/dashboard',
  tostador: '/tostador/dashboard',
  cafeteria: '/cafeteria/dashboard',
};
