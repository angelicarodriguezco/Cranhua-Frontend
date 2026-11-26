import { enlacePerfilDesdeApi } from './menu-publico.mapper';
import { fechaMiembroDesdeApi } from './perfil-cafeteria.mapper';
import { ubicacionLabelDesdeApi } from './punto-mapa-consumidor.mapper';
import { nivelTuesteDesdeApi } from './tueste.mapper';
import { PerfilTostador, PerfilTostadorResponseApi } from '../models/perfil-tostador.model';

export function perfilTostadorDesdeApi(api: PerfilTostadorResponseApi): PerfilTostador {
  return {
    id: api.id,
    nombre: api.nombre,
    ubicacion: ubicacionLabelDesdeApi(api.canton, api.provincia),
    descripcion: api.descripcion?.trim() || '',
    estilos: (api.estilos ?? []).map(nivelTuesteDesdeApi),
    portadaUrl: api.portadaUrl ?? null,
    miembroDesde: fechaMiembroDesdeApi(api.miembroDesde),
    fincas: (api.fincas ?? []).map(enlacePerfilDesdeApi),
    puntosVenta: (api.puntosVenta ?? []).map(enlacePerfilDesdeApi),
  };
}
