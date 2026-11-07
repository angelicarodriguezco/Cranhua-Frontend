import { Coordenada } from './finca.model';
import { EnlacePerfilPublico } from './perfil-tostador.model';

export interface PerfilCafeteria {
  id: string;
  nombre: string;
  ubicacion: string;
  descripcion: string;
  coordenada: Coordenada;
  cafesTrazables: number;
  tostadores: EnlacePerfilPublico[];
  horario: string;
  miembroDesde: string;
  fincas: EnlacePerfilPublico[];
}
