import { enlacePerfilDesdeApi } from './menu-publico.mapper';
import { fechaMiembroDesdeApi } from './perfil-cafeteria.mapper';
import { ubicacionLabelDesdeApi } from './punto-mapa-consumidor.mapper';
import {
  PerfilFincaPublico,
  PerfilFincaPublicoResponseApi,
} from '../models/perfil-finca-publico.model';

export function perfilFincaPublicoDesdeApi(api: PerfilFincaPublicoResponseApi): PerfilFincaPublico {
  return {
    id: api.id,
    nombre: api.nombre,
    ubicacion: ubicacionLabelDesdeApi(api.canton, api.provincia),
    descripcion: api.descripcion?.trim() || '',
    zona: api.zonaCafetalera ?? null,
    propietarios: api.propietarios ?? [],
    variedades: api.variedades ?? [],
    procesos: api.procesos ?? [],
    enCranhuaDesde: fechaMiembroDesdeApi(api.enCranhuaDesde),
    cosechasActivas: (api.cosechasActivas ?? []).map((cosecha) => ({
      id: cosecha.id,
      codigo: cosecha.codigoLote,
      variedad: cosecha.variedad,
      proceso: cosecha.proceso,
      alturaMsnm: cosecha.alturaMsnm ?? null,
      kgDisponibles: Number(cosecha.kgDisponibles),
    })),
    cafeterias: (api.cafeterias ?? []).map(enlacePerfilDesdeApi),
  };
}
