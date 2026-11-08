import { RolCuenta } from './cuenta.model';

export type RolApi = 'CAFETALERO' | 'TOSTADOR' | 'CAFETERIA';

export type TipoRedSocialApi = 'INSTAGRAM' | 'WHATSAPP' | 'FACEBOOK' | 'SITIO_WEB';

export interface RedSocialApi {
  tipo: TipoRedSocialApi;
  valor: string;
}

export interface CuentaResponseApi {
  id: string;
  nombreCompleto: string;
  correo: string;
  roles: RolApi[];
  telefono?: string | null;
  fotoUrl?: string | null;
  redes?: RedSocialApi[];
}

export interface ActualizarCuentaRequest {
  nombreCompleto?: string;
  telefono?: string | null;
  fotoUrl?: string | null;
  redes?: RedSocialApi[];
}

export interface RegistroRequest {
  nombreCompleto: string;
  correo: string;
  contrasena: string;
  roles: RolApi[];
  telefono?: string;
}

export interface RegistroGoogleRequest {
  credencial: string;
  roles: RolApi[];
}

export interface IniciarSesionRequest {
  correo: string;
  contrasena: string;
}

export interface IniciarSesionGoogleRequest {
  credencial: string;
}

export interface RecuperarContrasenaRequest {
  correo: string;
}

export interface VerificarCodigoRequest {
  correo: string;
  codigo: string;
}

export interface RestablecerContrasenaRequest {
  correo: string;
  codigo: string;
  contrasena: string;
}

export interface ErrorAuth {
  mensaje: string;
  errores?: Record<string, string>;
}

export const ROL_A_API: Record<RolCuenta, RolApi> = {
  cafetalero: 'CAFETALERO',
  tostador: 'TOSTADOR',
  cafeteria: 'CAFETERIA',
};

export const ROL_DESDE_API: Record<RolApi, RolCuenta> = {
  CAFETALERO: 'cafetalero',
  TOSTADOR: 'tostador',
  CAFETERIA: 'cafeteria',
};
