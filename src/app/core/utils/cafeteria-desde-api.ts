import { CANTONES_URBANOS } from '../mocks/cafeteria.mock';
import { CANTONES } from '../mocks/finca.mock';
import {
  Cafeteria,
  CafeteriaRegistroApi,
  CafeteriaResponseApi,
  CantonReferencia,
  EstiloCafe,
  EstiloCafeApi,
  NuevaCafeteria,
  VolumenMensual,
  VolumenMensualApi,
} from '../models/cafeteria.model';

const CANTONES_CAFETERIA: CantonReferencia[] = [...CANTONES_URBANOS, ...CANTONES];

const ESTILO_A_API: Record<EstiloCafe, EstiloCafeApi> = {
  Claro: 'CLARO',
  Medio: 'MEDIO',
  Oscuro: 'OSCURO',
};

const ESTILO_DESDE_API: Record<EstiloCafeApi, EstiloCafe> = {
  CLARO: 'Claro',
  MEDIO: 'Medio',
  OSCURO: 'Oscuro',
};

const VOLUMEN_A_API: Record<VolumenMensual, VolumenMensualApi> = {
  'Menos de 10 kg': 'MENOS_DE_10',
  '10 – 25 kg': 'DE_10_A_25',
  '25 – 50 kg': 'DE_25_A_50',
  '50 – 100 kg': 'DE_50_A_100',
  'Más de 100 kg': 'MAS_DE_100',
};

const VOLUMEN_DESDE_API: Record<VolumenMensualApi, VolumenMensual> = {
  MENOS_DE_10: 'Menos de 10 kg',
  DE_10_A_25: '10 – 25 kg',
  DE_25_A_50: '25 – 50 kg',
  DE_50_A_100: '50 – 100 kg',
  MAS_DE_100: 'Más de 100 kg',
};

function cantonDe(api: CafeteriaResponseApi): CantonReferencia {
  return (
    CANTONES_CAFETERIA.find((c) => c.nombre === api.canton) ?? {
      nombre: api.canton,
      provincia: api.provincia,
      cabecera: api.ubicacion,
    }
  );
}

export function cafeteriaDesdeApi(api: CafeteriaResponseApi): Cafeteria {
  return {
    id: api.id,
    nombre: api.nombre,
    contacto: api.nombreContacto,
    telefono: api.telefono,
    correo: api.correo,
    descripcion: api.descripcion,
    horario: api.horario,
    ubicacion: api.ubicacion,
    canton: cantonDe(api),
    volumenMensual: api.volumenMensual ? VOLUMEN_DESDE_API[api.volumenMensual] : null,
    estilos: api.estilos.map((estilo) => ESTILO_DESDE_API[estilo]),
    propietarioId: api.cuentaId,
    portadaUrl: api.portadaUrl,
  };
}

export function cuerpoRegistro(
  nueva: Omit<NuevaCafeteria, 'propietarioId'>,
): CafeteriaRegistroApi {
  return {
    nombre: nueva.nombre,
    nombreContacto: nueva.contacto,
    telefono: nueva.telefono,
    correo: nueva.correo,
    descripcion: nueva.descripcion,
    horario: nueva.horario,
    ubicacion: nueva.ubicacion,
    canton: nueva.canton?.nombre ?? '',
    provincia: nueva.canton?.provincia ?? '',
    estilos: nueva.estilos.map((estilo) => ESTILO_A_API[estilo]),
    volumenMensual: nueva.volumenMensual ? VOLUMEN_A_API[nueva.volumenMensual] : null,
    portadaUrl: nueva.portadaUrl ?? null,
  };
}
