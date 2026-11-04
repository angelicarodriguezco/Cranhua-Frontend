import { Coordenada } from './finca.model';

export type TipoPuntoMapaConsumidor = 'finca' | 'tostador' | 'cafeteria';

export interface PuntoMapaConsumidor {
  id: string;
  tipo: TipoPuntoMapaConsumidor;
  nombre: string;
  ubicacionLabel: string;
  coordenada: Coordenada;
  rutaPerfil: string;
}

export interface CodigoTrazabilidadConsumidor {
  codigo: string;
  fincaId: string;
  cosechaId: string;
}
