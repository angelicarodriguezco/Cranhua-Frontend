import { Coordenada, Finca, Usuario, ZonaCafetalera } from '../models/finca.model';
import { areaHectareas, centroide } from '../../shared/utils/geo';

// Datos de ejemplo mientras no existe el endpoint de fincas

export const USUARIO_ACTUAL: Usuario = {
  id: 'u-rodrigo',
  nombre: 'Rodrigo',
  apellidos: 'Solís Ureña',
  correo: 'rodrigo.solis@ejemplo.cr',
};

export const USUARIOS: Usuario[] = [
  USUARIO_ACTUAL,
  {
    id: 'u-maria',
    nombre: 'María',
    apellidos: 'Jiménez Solano',
    correo: 'maria.jimenez@ejemplo.cr',
  },
  {
    id: 'u-andres',
    nombre: 'Andrés',
    apellidos: 'Vargas Quesada',
    correo: 'andres.vargas@ejemplo.cr',
  },
  {
    id: 'u-lucia',
    nombre: 'Lucía',
    apellidos: 'Mora Castro',
    correo: 'lucia.mora@ejemplo.cr',
  },
];

function fincaDeEjemplo(
  id: string,
  nombre: string,
  zona: ZonaCafetalera,
  canton: string,
  provincia: string,
  propietarioId: string,
  perimetro: Coordenada[],
  duenosAdicionales: Usuario[] = [],
): Finca {
  return {
    id,
    nombre,
    descripcion: null,
    zona,
    perimetro,
    ubicacion: centroide(perimetro),
    canton: { nombre: canton, provincia, zona, cabecera: centroide(perimetro) },
    areaHectareas: areaHectareas(perimetro),
    propietarioId,
    duenosAdicionales,
  };
}

// Finca El Tucán queda justo al este del centro inicial del mapa, para poder probar la superposición
export const FINCAS_REGISTRADAS: Finca[] = [
  fincaDeEjemplo('f-el-tucan', 'Finca El Tucán', 'Tarrazú', 'Tarrazú', 'San José', 'u-andres', [
    { lat: 9.6588, lng: -84.029 },
    { lat: 9.6584, lng: -84.0262 },
    { lat: 9.6566, lng: -84.0256 },
    { lat: 9.6555, lng: -84.0278 },
    { lat: 9.6568, lng: -84.03 },
  ]),
  fincaDeEjemplo('f-las-brisas', 'Finca Las Brisas', 'Tarrazú', 'Dota', 'San José', 'u-lucia', [
    { lat: 9.6532, lng: -83.9712 },
    { lat: 9.6529, lng: -83.9684 },
    { lat: 9.651, lng: -83.9681 },
    { lat: 9.6508, lng: -83.9709 },
  ]),
  fincaDeEjemplo(
    'f-monte-alto',
    'Finca Monte Alto',
    'Valle Occidental',
    'Naranjo',
    'Alajuela',
    'u-andres',
    [
      { lat: 10.1012, lng: -84.3815 },
      { lat: 10.1009, lng: -84.3788 },
      { lat: 10.0991, lng: -84.3792 },
      { lat: 10.0994, lng: -84.3819 },
    ],
  ),
  fincaDeEjemplo(
    'f-la-esperanza',
    'Finca La Esperanza',
    'Tarrazú',
    'León Cortés',
    'San José',
    'u-rodrigo',
    [
      { lat: 9.7102, lng: -84.0601 },
      { lat: 9.7099, lng: -84.0572 },
      { lat: 9.7078, lng: -84.0569 },
      { lat: 9.7081, lng: -84.0598 },
    ],
    USUARIOS.filter((u) => u.id === 'u-maria'),
  ),
  fincaDeEjemplo(
    'f-el-mirador',
    'Finca El Mirador',
    'Valle Occidental',
    'Grecia',
    'Alajuela',
    'u-rodrigo',
    [
      { lat: 10.0758, lng: -84.3148 },
      { lat: 10.0755, lng: -84.3121 },
      { lat: 10.0736, lng: -84.3124 },
      { lat: 10.0739, lng: -84.3151 },
    ],
  ),
];
