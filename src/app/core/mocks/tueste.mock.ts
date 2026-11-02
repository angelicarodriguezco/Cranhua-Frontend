import { LoteComprado, Tueste } from '../models/tueste.model';

// Datos de ejemplo mientras no existen los endpoints de compras y tuestes. Son lotes de las
// cosechas de cosechas-disponibles.mock.ts.
export const LOTES_COMPRADOS: LoteComprado[] = [
  {
    id: 'l-catalina-caturra',
    codigoLote: 'CRH-2026-0101',
    finca: 'La Catalina',
    variedad: 'Caturra',
    proceso: 'Honey',
    kg: 60,
  },
  {
    id: 'l-monte-alto-geisha',
    codigoLote: 'CRH-2026-0102',
    finca: 'Monte Alto',
    variedad: 'Geisha',
    proceso: 'Lavado',
    kg: 30,
  },
  {
    id: 'l-los-robles-catuai',
    codigoLote: 'CRH-2026-0103',
    finca: 'Los Robles',
    variedad: 'Catuaí',
    proceso: 'Lavado',
    kg: 45,
  },
];

export const TUESTES_REGISTRADOS: Tueste[] = [
  {
    id: 'tu-catalina-1',
    loteId: 'l-catalina-caturra',
    nivel: 'Medio',
    pesoVerdeKg: 12,
    pesoTostadoKg: 10.2,
    fecha: '2026-10-21',
    notas: 'Desarrollo de 1:45 después del primer crack.',
    codigoTrazabilidad: 'CRH-2026-0101-T01',
  },
  {
    id: 'tu-monte-alto-1',
    loteId: 'l-monte-alto-geisha',
    nivel: 'Claro',
    pesoVerdeKg: 5,
    pesoTostadoKg: 4.35,
    fecha: '2026-10-28',
    notas: null,
    codigoTrazabilidad: 'CRH-2026-0102-T01',
  },
];
