import { Cuenta } from '../models/cuenta.model';

export const CUENTA_SOLO_CAFETALERO: Cuenta = {
  id: 'u-rodrigo',
  nombreCompleto: 'Rodrigo Alvarado',
  correo: 'rodrigo.alvarado@ejemplo.cr',
  roles: ['cafetalero'],
};

export const CUENTA_CAFETALERO_TOSTADOR: Cuenta = {
  ...CUENTA_SOLO_CAFETALERO,
  roles: ['cafetalero', 'tostador'],
};

export const CUENTA_TRES_ROLES: Cuenta = {
  ...CUENTA_SOLO_CAFETALERO,
  roles: ['cafetalero', 'tostador', 'cafeteria'],
};

export const CUENTA_ACTUAL: Cuenta = CUENTA_TRES_ROLES;
