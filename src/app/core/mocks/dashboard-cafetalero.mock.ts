import {
  CosechaReciente,
  FincaResumen,
  PerfilCafetaleroSidebar,
} from '../models/dashboard-cafetalero.model';

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
    estado: 'Publicada',
  },
  {
    id: 'cosecha-geisha-monte-alto',
    variedad: 'Geisha',
    finca: 'Monte Alto',
    proceso: 'Lavado',
    kgDisponibles: 50,
    estado: 'Publicada',
  },
  {
    id: 'cosecha-catuai-catalina',
    variedad: 'Catuaí',
    finca: 'La Catalina',
    proceso: 'Natural',
    kgDisponibles: null,
    estado: 'Borrador',
  },
];
