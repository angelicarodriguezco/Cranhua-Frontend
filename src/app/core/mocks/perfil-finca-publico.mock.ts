import { PerfilFincaPublico } from '../models/perfil-finca-publico.model';

export const PERFILES_FINCA_PUBLICO: PerfilFincaPublico[] = [
  {
    id: 'finca-el-roble',
    nombre: 'Finca El Roble',
    ubicacionLabel: 'Naranjo, Costa Rica',
    descripcion:
      'Finca familiar que cultiva café bajo sombra a 1.450 msnm. Produce cosechas de Catuai y Geisha, procesadas con métodos honey y lavado según el lote, buscando siempre notas florales, de miel y de alta taza.',
    etiqueta: 'Finca cafetalera',
    propietario: 'Familia Solís Vargas',
    altitudMsnm: 1450,
    variedades: ['Catuai', 'Geisha'],
    procesos: ['Honey', 'Lavado'],
    enCranhuaDesde: 'Abril 2025',
    cosechaActiva: {
      id: 'cosecha-catuai-el-roble',
      codigo: 'CRH-2026-0103',
      variedad: 'Catuai',
      proceso: 'Honey',
      kilos: 290,
    },
    coordenada: { lat: 10.1025, lng: -84.3812 },
    cafeterias: [
      {
        id: 'c-cafe-brumas',
        nombre: 'Café Brumas',
        ubicacionLabel: 'Escazú',
        rutaPerfil: '/explorar/cafeteria/c-cafe-brumas',
      },
    ],
  },
  {
    id: 'finca-la-catalina',
    nombre: 'Finca La Catalina',
    ubicacionLabel: 'Tarrazú, Costa Rica',
    descripcion:
      'Finca de altura en Tarrazú con lotes de Caturra procesados en honey, orientados a notas de panela y cítricos.',
    etiqueta: 'Finca cafetalera',
    propietario: 'Familia Jiménez',
    altitudMsnm: 1600,
    variedades: ['Caturra'],
    procesos: ['Honey'],
    enCranhuaDesde: 'Enero 2025',
    cosechaActiva: {
      id: 'cosecha-caturra-catalina',
      codigo: 'CRH-2025-0042',
      variedad: 'Caturra',
      proceso: 'Honey',
      kilos: 180,
    },
    coordenada: { lat: 9.6612, lng: -84.031 },
    cafeterias: [],
  },
];
