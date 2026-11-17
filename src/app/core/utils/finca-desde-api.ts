import { Finca, FincaResponseApi } from '../models/finca.model';
import { usuarioDesdeNombreCompleto } from './nombre-usuario';

// El usuario actual queda como propietario si es dueño; los demás van como adicionales
export function fincaDesdeApi(api: FincaResponseApi, usuarioId: string): Finca {
  const propietario = api.duenos.find((d) => d.id === usuarioId) ?? api.duenos[0];
  return {
    id: api.id,
    nombre: api.nombre,
    descripcion: api.descripcion,
    zona: api.zonaCafetalera,
    perimetro: api.perimetro,
    ubicacion: api.ubicacion,
    canton: {
      nombre: api.canton,
      provincia: api.provincia,
      zona: api.zonaCafetalera,
      cabecera: api.ubicacion,
    },
    areaHectareas: api.areaHectareas,
    propietarioId: propietario?.id ?? '',
    duenosAdicionales: api.duenos
      .filter((d) => d !== propietario)
      .map((d) => usuarioDesdeNombreCompleto(d.id, d.nombreCompleto, '')),
  };
}
