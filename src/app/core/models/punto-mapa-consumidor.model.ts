import { Coordenada } from './finca.model';

export type TipoPuntoMapaConsumidor = 'finca' | 'tostador' | 'cafeteria';

export type TipoPuntoMapaApi = 'FINCA' | 'TOSTADOR' | 'CAFETERIA';

export interface PuntoMapaConsumidor {
  id: string;
  tipo: TipoPuntoMapaConsumidor;
  nombre: string;
  ubicacionLabel: string;
  coordenada: Coordenada;
  rutaPerfil: string;
}

export interface PuntoMapaResponseApi {
  tipo: TipoPuntoMapaApi;
  id: string;
  nombre: string;
  canton: string;
  provincia: string;
  coordenada: Coordenada;
}

export interface CodigoTrazabilidadConsumidor {
  codigo: string;
  fincaId: string;
  cosechaId: string;
}
