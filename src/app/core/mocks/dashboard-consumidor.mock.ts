import {
  CodigoTrazabilidadConsumidor,
  PuntoMapaConsumidor,
} from '../models/punto-mapa-consumidor.model';

export const PUNTOS_MAPA_CONSUMIDOR: PuntoMapaConsumidor[] = [
  {
    id: 'finca-la-catalina',
    tipo: 'finca',
    nombre: 'Finca La Catalina',
    ubicacionLabel: 'Tarrazú',
    coordenada: { lat: 9.6612, lng: -84.031 },
    rutaPerfil: '/explorar/finca/finca-la-catalina',
  },
  {
    id: 'finca-el-roble',
    tipo: 'finca',
    nombre: 'Finca El Roble',
    ubicacionLabel: 'Naranjo',
    coordenada: { lat: 10.1025, lng: -84.3812 },
    rutaPerfil: '/explorar/finca/finca-el-roble',
  },
  {
    id: 'n-tostaduria-volcan',
    tipo: 'tostador',
    nombre: 'Tostaduría Volcán',
    ubicacionLabel: 'San José',
    coordenada: { lat: 9.9335, lng: -84.0775 },
    rutaPerfil: '/explorar/tostador/n-tostaduria-volcan',
  },
  {
    id: 'c-cafe-brumas',
    tipo: 'cafeteria',
    nombre: 'Café Brumas',
    ubicacionLabel: 'Escazú',
    coordenada: { lat: 9.9205, lng: -84.137 },
    rutaPerfil: '/explorar/cafeteria/c-cafe-brumas',
  },
];

export const CODIGOS_TRAZABILIDAD_CONSUMIDOR: CodigoTrazabilidadConsumidor[] = [
  {
    codigo: 'CRH-2026-0103',
    fincaId: 'finca-el-roble',
    cosechaId: 'cosecha-catuai-el-roble',
  },
];
