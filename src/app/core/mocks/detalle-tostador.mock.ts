import { DetalleTostador } from '../models/detalle-tostador.model';
import { TostadorDisponible } from '../models/tostador-disponible.model';
import { TOSTADORES_DISPONIBLES } from './tostadores-disponibles.mock';

type DatosTostador = Omit<DetalleTostador, keyof TostadorDisponible>;

const DATOS_TOSTADOR: Record<string, DatosTostador> = {
  'tostador-volcan': {
    descripcion: 'Tostaduría artesanal en San José, con tuestes claros y medios de microlotes.',
    contacto: { nombre: 'Laura Mora', telefono: '8888-1020', correo: 'laura@tostaduriavolcan.cr' },
    tuestes: [
      {
        id: 'tv-catalina',
        finca: 'La Catalina',
        variedad: 'Caturra',
        nivel: 'Claro',
        kgDisponibles: 60,
      },
      {
        id: 'tv-monte-alto',
        finca: 'Monte Alto',
        variedad: 'Geisha',
        nivel: 'Claro',
        kgDisponibles: 25,
      },
      {
        id: 'tv-los-robles',
        finca: 'Los Robles',
        variedad: 'Catuaí',
        nivel: 'Medio',
        kgDisponibles: 95,
      },
    ],
  },
  'tostador-cerro-azul': {
    descripcion: 'Tostadores de Heredia enfocados en perfiles achocolatados para espresso.',
    contacto: { nombre: 'Diego Araya', telefono: '8777-3344', correo: 'diego@cerroazul.cr' },
    tuestes: [
      {
        id: 'tca-cerro-verde',
        finca: 'Cerro Verde',
        variedad: 'Bourbon',
        nivel: 'Medio',
        kgDisponibles: 45,
      },
      {
        id: 'tca-el-cedral',
        finca: 'El Cedral',
        variedad: 'Villa Sarchí',
        nivel: 'Oscuro',
        kgDisponibles: 30,
      },
      {
        id: 'tca-la-catalina',
        finca: 'La Catalina',
        variedad: 'Caturra',
        nivel: 'Oscuro',
        kgDisponibles: 20,
      },
    ],
  },
  'tostador-fuego-lento': {
    descripcion: 'Tuestes oscuros y lentos, pensados para métodos de inmersión y café con leche.',
    contacto: { nombre: 'Sofía Brenes', telefono: '8666-5511', correo: 'sofia@fuegolento.cr' },
    tuestes: [
      {
        id: 'tfl-los-robles',
        finca: 'Los Robles',
        variedad: 'Catuaí',
        nivel: 'Oscuro',
        kgDisponibles: 25,
      },
      {
        id: 'tfl-el-cedral',
        finca: 'El Cedral',
        variedad: 'Villa Sarchí',
        nivel: 'Oscuro',
        kgDisponibles: 15,
      },
    ],
  },
};

const CONTACTO_POR_DEFECTO = {
  nombre: 'Equipo de ventas',
  telefono: '8000-0000',
  correo: 'ventas@ejemplo.cr',
};

export const DETALLES_TOSTADOR: DetalleTostador[] = TOSTADORES_DISPONIBLES.map((tostador) => ({
  ...tostador,
  ...(DATOS_TOSTADOR[tostador.id] ?? {
    descripcion: `Tostaduría de ${tostador.ubicacion} con tuestes ${tostador.estilos.join(', ').toLowerCase()}.`,
    contacto: CONTACTO_POR_DEFECTO,
    tuestes:
      tostador.kgDisponibles > 0
        ? [
            {
              id: `${tostador.id}-casa`,
              finca: 'Mezcla de la casa',
              variedad: 'Catuaí',
              nivel: tostador.estilos[0],
              kgDisponibles: tostador.kgDisponibles,
            },
          ]
        : [],
  }),
}));
