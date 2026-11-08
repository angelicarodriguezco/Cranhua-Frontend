import { CANTONES } from '../mocks/finca.mock';
import { Canton, Finca, FincaResponseApi } from '../models/finca.model';
import { usuarioDesdeNombreCompleto } from './nombre-usuario';

function cantonDe(api: FincaResponseApi): Canton {
  return (
    CANTONES.find((c) => c.nombre === api.canton) ?? {
      nombre: api.canton,
      provincia: api.provincia,
      zona: api.zonaCafetalera,
      cabecera: api.ubicacion,
    }
  );
}

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
    canton: cantonDe(api),
    areaHectareas: api.areaHectareas,
    propietarioId: propietario?.id ?? '',
    duenosAdicionales: api.duenos
      .filter((d) => d !== propietario)
      .map((d) => usuarioDesdeNombreCompleto(d.id, d.nombreCompleto, '')),
  };
}
