import { enlacePerfilDesdeApi } from './menu-publico.mapper';
import { ubicacionLabelDesdeApi } from './punto-mapa-consumidor.mapper';
import { PerfilCafeteria, PerfilCafeteriaResponseApi } from '../models/perfil-cafeteria.model';

export function fechaMiembroDesdeApi(miembroDesde: string): string {
  return miembroDesde.slice(0, 10);
}

export function perfilCafeteriaDesdeApi(api: PerfilCafeteriaResponseApi): PerfilCafeteria {
  return {
    id: api.id,
    nombre: api.nombre,
    ubicacion: ubicacionLabelDesdeApi(api.canton, api.provincia),
    descripcion: api.descripcion?.trim() || '',
    coordenada: api.ubicacion,
    cafesTrazables: Number(api.cafesTrazables),
    tostadores: (api.tostadores ?? []).map(enlacePerfilDesdeApi),
    horario: api.horario?.trim() || '',
    miembroDesde: fechaMiembroDesdeApi(api.miembroDesde),
    fincas: (api.fincas ?? []).map(enlacePerfilDesdeApi),
    portadaUrl: api.portadaUrl ?? null,
  };
}
