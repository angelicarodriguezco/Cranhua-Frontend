import { COSECHAS_DISPONIBLES } from './cosechas-disponibles.mock';
import { CosechaDisponible } from '../models/cosecha-disponible.model';
import { DetalleCosecha } from '../models/detalle-cosecha.model';

type DatosLote = Omit<DetalleCosecha, keyof CosechaDisponible>;

// Datos de ejemplo mientras no existe el endpoint de detalle de cosecha. Precios en colones.
const DATOS_LOTE: Record<string, DatosLote> = {
  'cosecha-caturra-catalina': {
    altitudMsnm: 1650,
    kgDisponibles: 320,
    precioKg: 5800,
    descripcion:
      'Lote de Caturra cosechado a mano en la parte alta de la finca y secado en camas africanas.',
    productor: {
      id: 'u-rodrigo',
      nombre: 'Rodrigo',
      apellidos: 'Solís Ureña',
      correo: 'rodrigo.solis@ejemplo.cr',
    },
  },
  'cosecha-geisha-monte-alto': {
    altitudMsnm: 1900,
    kgDisponibles: 85,
    precioKg: 14500,
    descripcion: 'Microlote de Geisha lavado, fermentación de 36 horas en tanque.',
    productor: {
      id: 'u-maria',
      nombre: 'María',
      apellidos: 'Jiménez Solano',
      correo: 'maria.jimenez@ejemplo.cr',
    },
  },
};

const PRODUCTOR_POR_DEFECTO = {
  id: 'u-andres',
  nombre: 'Andrés',
  apellidos: 'Vargas Quesada',
  correo: 'andres.vargas@ejemplo.cr',
};

export const DETALLES_COSECHA: DetalleCosecha[] = COSECHAS_DISPONIBLES.map((cosecha) => ({
  ...cosecha,
  ...(DATOS_LOTE[cosecha.id] ?? {
    altitudMsnm: 1400,
    kgDisponibles: 200,
    precioKg: cosecha.precioDesdeKg,
    descripcion: `Lote de ${cosecha.variedad} con proceso ${cosecha.proceso.toLowerCase()}.`,
    productor: PRODUCTOR_POR_DEFECTO,
  }),
}));
