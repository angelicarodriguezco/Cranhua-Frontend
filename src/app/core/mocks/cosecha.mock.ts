import { Cosecha } from '../models/cosecha.model';

// Datos de ejemplo mientras no existe el endpoint de cosechas
export const COSECHAS_REGISTRADAS: Cosecha[] = [
  {
    id: 'c-le-caturra',
    fincaId: 'f-la-esperanza',
    variedad: 'Caturra',
    proceso: 'Honey',
    codigoLote: 'LE-2026-001',
    kgDisponibles: 96,
    estado: 'Disponible',
  },
  {
    id: 'c-le-catuai',
    fincaId: 'f-la-esperanza',
    variedad: 'Catuaí',
    proceso: 'Natural',
    codigoLote: 'LE-2026-002',
    kgDisponibles: null,
    estado: 'En beneficiado',
  },
  {
    id: 'c-em-geisha',
    fincaId: 'f-el-mirador',
    variedad: 'Geisha',
    proceso: 'Lavado',
    codigoLote: 'EM-2026-001',
    kgDisponibles: 50,
    estado: 'Disponible',
  },
];
