import {
  ActualizarCuentaRequest,
  CuentaResponseApi,
  RedSocialApi,
  ROL_DESDE_API,
  TipoRedSocialApi,
} from '../models/auth.model';
import { Cuenta, RolCuenta } from '../models/cuenta.model';
import { PerfilUsuario, RedSocial, TipoRedSocial } from '../models/perfil.model';

const RED_UI_A_API: Record<TipoRedSocial, TipoRedSocialApi> = {
  instagram: 'INSTAGRAM',
  whatsapp: 'WHATSAPP',
  facebook: 'FACEBOOK',
  sitio: 'SITIO_WEB',
};

const RED_API_A_UI: Record<TipoRedSocialApi, TipoRedSocial> = {
  INSTAGRAM: 'instagram',
  WHATSAPP: 'whatsapp',
  FACEBOOK: 'facebook',
  SITIO_WEB: 'sitio',
};

const ETIQUETA_ROL: Record<RolCuenta, string> = {
  cafetalero: 'Cafetalero',
  tostador: 'Tostador',
  cafeteria: 'Cafetería',
};

export function mapearTipoRedHaciaApi(tipo: TipoRedSocial): TipoRedSocialApi {
  return RED_UI_A_API[tipo];
}

export function mapearTipoRedDesdeApi(tipo: TipoRedSocialApi): TipoRedSocial {
  return RED_API_A_UI[tipo];
}

export function mapearRedesHaciaApi(redes: RedSocial[]): RedSocialApi[] {
  return redes.map((red) => ({
    tipo: mapearTipoRedHaciaApi(red.tipo),
    valor: red.valor,
  }));
}

export function mapearRedesDesdeApi(redes: RedSocialApi[]): RedSocial[] {
  return redes.map((red) => ({
    tipo: mapearTipoRedDesdeApi(red.tipo),
    valor: red.valor,
  }));
}

export function etiquetaRoles(roles: readonly RolCuenta[]): string {
  return roles.map((rol) => ETIQUETA_ROL[rol]).join(' · ');
}

export function mapearCuentaResponseAPerfil(cuenta: CuentaResponseApi): PerfilUsuario {
  return {
    id: cuenta.id,
    nombreCompleto: cuenta.nombreCompleto,
    correo: cuenta.correo,
    telefono: cuenta.telefono ?? '',
    roles: cuenta.roles.map((rol) => ROL_DESDE_API[rol]),
    redes: mapearRedesDesdeApi(cuenta.redes ?? []),
    portadaUrl: null,
    avatarUrl: cuenta.fotoUrl ?? null,
  };
}

export function mapearCuentaResponseACuenta(cuenta: CuentaResponseApi): Cuenta {
  return {
    id: cuenta.id,
    nombreCompleto: cuenta.nombreCompleto,
    correo: cuenta.correo,
    roles: cuenta.roles.map((rol) => ROL_DESDE_API[rol]),
  };
}

export interface ActualizarPerfilDatos {
  nombreCompleto?: string;
  telefono?: string;
  redes?: RedSocial[];
}

export function aActualizarCuentaRequest(datos: ActualizarPerfilDatos): ActualizarCuentaRequest {
  const body: ActualizarCuentaRequest = {};
  if (datos.nombreCompleto !== undefined) {
    body.nombreCompleto = datos.nombreCompleto;
  }
  if (datos.telefono !== undefined) {
    const telefono = datos.telefono.trim();
    body.telefono = telefono.length > 0 ? telefono : null;
  }
  if (datos.redes !== undefined) {
    body.redes = mapearRedesHaciaApi(datos.redes);
  }
  return body;
}
