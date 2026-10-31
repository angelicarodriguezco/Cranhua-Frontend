import { CosechaHistorial, LoteVendido } from '../models/historial-cafetalero.model';

// Las tres primeras coinciden con las cosechas recientes del dashboard
export const COSECHAS_HISTORIAL: CosechaHistorial[] = [
  {
    id: 'cosecha-catuai-catalina',
    fecha: '2025-12-01',
    variedad: 'Catuaí',
    kilos: 90,
    estado: 'En beneficiado',
  },
  {
    id: 'cosecha-caturra-catalina',
    fecha: '2025-11-01',
    variedad: 'Caturra',
    kilos: 120,
    estado: 'Disponible',
  },
  {
    id: 'cosecha-geisha-monte-alto',
    fecha: '2025-10-20',
    variedad: 'Geisha',
    kilos: 70,
    estado: 'Disponible',
  },
  {
    id: 'cosecha-bourbon-monte-alto',
    fecha: '2025-09-14',
    variedad: 'Bourbon',
    kilos: 85,
    estado: 'En catación',
  },
  {
    id: 'cosecha-typica-catalina',
    fecha: '2025-06-10',
    variedad: 'Typica',
    kilos: 110,
    estado: 'Vendida',
  },
  {
    id: 'cosecha-villa-sarchi-catalina',
    fecha: '2025-04-22',
    variedad: 'Villa Sarchí',
    kilos: 140,
    estado: 'Vendida',
  },
  {
    id: 'cosecha-geisha-monte-alto-marzo',
    fecha: '2025-03-05',
    variedad: 'Geisha',
    kilos: 60,
    estado: 'Vendida',
  },
];

// Código de trazabilidad: CRN-<finca>-<año y mes de cosecha>-<consecutivo>
export const LOTES_VENDIDOS: LoteVendido[] = [
  {
    codigo: 'CRN-LC-2506-02',
    cosechaId: 'cosecha-typica-catalina',
    comprador: 'Café Altamira',
    kilos: 50,
    precioColones: 575_000,
    fechaVenta: '2025-07-18',
  },
  {
    codigo: 'CRN-LC-2506-01',
    cosechaId: 'cosecha-typica-catalina',
    comprador: 'Tostaduría Volcán',
    kilos: 60,
    precioColones: 690_000,
    fechaVenta: '2025-07-02',
  },
  {
    codigo: 'CRN-LC-2504-01',
    cosechaId: 'cosecha-villa-sarchi-catalina',
    comprador: 'Café Altamira',
    kilos: 140,
    precioColones: 1_540_000,
    fechaVenta: '2025-05-30',
  },
  {
    codigo: 'CRN-MA-2503-01',
    cosechaId: 'cosecha-geisha-monte-alto-marzo',
    comprador: 'Tostaduría Volcán',
    kilos: 60,
    precioColones: 1_080_000,
    fechaVenta: '2025-04-12',
  },
];
