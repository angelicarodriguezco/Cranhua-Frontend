export type RolCuenta = 'cafetalero' | 'tostador' | 'cafeteria';

export interface Cuenta {
  id: string;
  nombreCompleto: string;
  correo: string;
  roles: RolCuenta[];
}
