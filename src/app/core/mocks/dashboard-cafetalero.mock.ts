import {
  CosechaReciente,
  FincaResumen,
  PerfilCafetaleroSidebar,
} from '../models/dashboard-cafetalero.model';

/** Perfil del footer del menú lateral (prototipo); el saludo usa SesionService. */
export const PERFIL_CAFETALERO_SIDEBAR: PerfilCafetaleroSidebar = {
  iniciales: 'RC',
  nombreCompleto: 'Rodrigo Alvarado',
  rol: 'Cafetalero',
};

export const FINCAS_DASHBOARD: FincaResumen[] = [
  {
    id: 'finca-la-catalina',
    nombre: 'La Catalina',
    ubicacion: 'Tarrazú, Costa Rica',
    cosechasActivas: 2,
  },
  {
    id: 'finca-monte-alto',
    nombre: 'Monte Alto',
    ubicacion: 'Dota, Costa Rica',
    cosechasActivas: 1,
  },
];

export const COSECHAS_DASHBOARD: CosechaReciente[] = [
  {
    id: 'cosecha-caturra-catalina',
    variedad: 'Caturra',
    finca: 'La Catalina',
    proceso: 'Honey',
    kgDisponibles: 96,
    estado: 'Disponible',
  },
  {
    id: 'cosecha-geisha-monte-alto',
    variedad: 'Geisha',
    finca: 'Monte Alto',
    proceso: 'Lavado',
    kgDisponibles: 50,
    estado: 'Disponible',
  },
  {
    id: 'cosecha-catuai-catalina',
    variedad: 'Catuaí',
    finca: 'La Catalina',
    proceso: 'Natural',
    kgDisponibles: null,
    estado: 'En beneficiado',
  },
];
