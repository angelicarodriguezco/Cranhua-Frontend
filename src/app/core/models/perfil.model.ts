export type TipoRedSocial = 'instagram' | 'whatsapp' | 'facebook' | 'sitio';

export const TIPOS_RED_SOCIAL: TipoRedSocial[] = ['instagram', 'whatsapp', 'facebook', 'sitio'];

export interface RedSocial {
  tipo: TipoRedSocial;
  valor: string;
}

export interface PerfilUsuario {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  ubicacion: string;
  biografia: string;
  rol: string;
  miembroDesde: number;
  redes: RedSocial[];
  portadaUrl: string | null;
  avatarUrl: string | null;
}
