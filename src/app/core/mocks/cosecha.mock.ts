import { Cosecha, FincaCosechaOpcion, ProcesoBeneficiado } from '../models/cosecha.model';

export const FINCAS_COSECHA: FincaCosechaOpcion[] = [
  { id: 'finca-la-catalina', nombre: 'La Catalina' },
  { id: 'finca-monte-alto', nombre: 'Monte Alto' },
];

export const PROCESOS_BENEFICIADO: ProcesoBeneficiado[] = [
  { id: 'honey', nombre: 'Honey', color: '#A57008' },
  { id: 'lavado', nombre: 'Lavado', color: '#2F6B45' },
  { id: 'natural', nombre: 'Natural', color: '#8B4513' },
  { id: 'anaerobico', nombre: 'Anaeróbico', color: '#4A6FA5' },
  { id: 'semi-lavado', nombre: 'Semi-lavado', color: '#6B8E23' },
];

export const VARIEDADES_CAFE = [
  'Caturra',
  'Catuaí',
  'Geisha',
  'Typica',
  'Bourbon',
  'Villa Sarchí',
] as const;

export const COSECHAS_INICIALES: Cosecha[] = [
  {
    id: 'cosecha-caturra-catalina',
    fincaId: 'finca-la-catalina',
    variedad: 'Caturra',
    alturaMsnm: 1650,
    cantidadTotalKg: 120,
    fechaInicio: '2025-11-01',
    fechaFin: '2025-11-15',
    procesos: [{ proceso: 'Honey', porcentaje: 100 }],
    pesoAntesKg: 120,
    pesoTrasSeleccionKg: 96,
    separoCaracolillo: true,
    pesoCaracolilloKg: 4,
    puntajeSca: 84.5,
    notasCatacion: 'Notas a chocolate y miel.',
  },
  {
    id: 'cosecha-geisha-monte-alto',
    fincaId: 'finca-monte-alto',
    variedad: 'Geisha',
    alturaMsnm: 1800,
    cantidadTotalKg: 70,
    fechaInicio: '2025-10-20',
    fechaFin: '2025-11-05',
    procesos: [{ proceso: 'Lavado', porcentaje: 100 }],
    pesoAntesKg: 70,
    pesoTrasSeleccionKg: 50,
    separoCaracolillo: false,
    pesoCaracolilloKg: null,
    puntajeSca: 88,
    notasCatacion: 'Floral, jazmín y bergamota.',
  },
  {
    id: 'cosecha-catuai-catalina',
    fincaId: 'finca-la-catalina',
    variedad: 'Catuaí',
    alturaMsnm: 1580,
    cantidadTotalKg: 90,
    fechaInicio: '2025-12-01',
    fechaFin: '2025-12-10',
    procesos: [{ proceso: 'Natural', porcentaje: 100 }],
    pesoAntesKg: 90,
    pesoTrasSeleccionKg: 0,
    separoCaracolillo: null,
    pesoCaracolilloKg: null,
    puntajeSca: null,
    notasCatacion: null,
  },
];
