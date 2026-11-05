import { PerfilTostador } from '../models/perfil-tostador.model';

export const PERFILES_TOSTADOR: PerfilTostador[] = [
  {
    id: 'n-tostaduria-volcan',
    nombre: 'Tostaduría Volcán',
    ubicacion: 'San José, Costa Rica',
    descripcion:
      'Tuesta en lotes pequeños para resaltar el origen de cada finca. Trabaja con fincas de ' +
      'Tarrazú y Naranjo dentro de Cránhua y publica el perfil de tueste de cada lote antes de venderlo.',
    coordenada: { lat: 9.9335, lng: -84.0775 },
    estilosTueste: ['Claro', 'Medio'],
    kgTostadosAnio: 1240,
    miembroDesde: '2025-03-15',
    fincas: [
      { id: 'finca-la-catalina', nombre: 'Finca La Catalina', ubicacion: 'Tarrazú' },
      { id: 'finca-el-roble', nombre: 'Finca El Roble', ubicacion: 'Naranjo' },
    ],
    puntosVenta: [{ id: 'c-cafe-brumas', nombre: 'Café Brumas', ubicacion: 'Escazú' }],
  },
];
