import { Canton, Coordenada, Finca, Usuario, ZonaCafetalera } from '../models/finca.model';
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

// Coordenadas aproximadas de la cabecera de cada cantón
export const CANTONES: Canton[] = [
  {
    nombre: 'Tarrazú',
    provincia: 'San José',
    zona: 'Tarrazú',
    cabecera: { lat: 9.6575, lng: -84.0247 },
  },
  {
    nombre: 'Dota',
    provincia: 'San José',
    zona: 'Tarrazú',
    cabecera: { lat: 9.6509, lng: -83.9686 },
  },
  {
    nombre: 'León Cortés',
    provincia: 'San José',
    zona: 'Tarrazú',
    cabecera: { lat: 9.7076, lng: -84.0575 },
  },
  {
    nombre: 'Pérez Zeledón',
    provincia: 'San José',
    zona: 'Brunca',
    cabecera: { lat: 9.373, lng: -83.703 },
  },
  {
    nombre: 'Alajuela',
    provincia: 'Alajuela',
    zona: 'Valle Central',
    cabecera: { lat: 10.0163, lng: -84.2116 },
  },
  {
    nombre: 'Poás',
    provincia: 'Alajuela',
    zona: 'Valle Central',
    cabecera: { lat: 10.071, lng: -84.241 },
  },
  {
    nombre: 'Grecia',
    provincia: 'Alajuela',
    zona: 'Valle Occidental',
    cabecera: { lat: 10.0731, lng: -84.312 },
  },
  {
    nombre: 'Sarchí',
    provincia: 'Alajuela',
    zona: 'Valle Occidental',
    cabecera: { lat: 10.089, lng: -84.346 },
  },
  {
    nombre: 'Naranjo',
    provincia: 'Alajuela',
    zona: 'Valle Occidental',
    cabecera: { lat: 10.0987, lng: -84.3786 },
  },
  {
    nombre: 'Palmares',
    provincia: 'Alajuela',
    zona: 'Valle Occidental',
    cabecera: { lat: 10.0559, lng: -84.4342 },
  },
  {
    nombre: 'San Ramón',
    provincia: 'Alajuela',
    zona: 'Valle Occidental',
    cabecera: { lat: 10.087, lng: -84.47 },
  },
  {
    nombre: 'Atenas',
    provincia: 'Alajuela',
    zona: 'Valle Occidental',
    cabecera: { lat: 9.9785, lng: -84.38 },
  },
  {
    nombre: 'Barva',
    provincia: 'Heredia',
    zona: 'Valle Central',
    cabecera: { lat: 10.0213, lng: -84.1235 },
  },
  {
    nombre: 'Santa Bárbara',
    provincia: 'Heredia',
    zona: 'Valle Central',
    cabecera: { lat: 10.039, lng: -84.158 },
  },
  {
    nombre: 'La Unión',
    provincia: 'Cartago',
    zona: 'Tres Ríos',
    cabecera: { lat: 9.903, lng: -83.985 },
  },
  {
    nombre: 'Paraíso',
    provincia: 'Cartago',
    zona: 'Orosi',
    cabecera: { lat: 9.837, lng: -83.865 },
  },
  {
    nombre: 'Turrialba',
    provincia: 'Cartago',
    zona: 'Turrialba',
    cabecera: { lat: 9.905, lng: -83.683 },
  },
  {
    nombre: 'Coto Brus',
    provincia: 'Puntarenas',
    zona: 'Brunca',
    cabecera: { lat: 8.821, lng: -82.969 },
  },
  {
    nombre: 'Nicoya',
    provincia: 'Guanacaste',
    zona: 'Guanacaste',
    cabecera: { lat: 10.148, lng: -85.452 },
  },
  {
    nombre: 'Hojancha',
    provincia: 'Guanacaste',
    zona: 'Guanacaste',
    cabecera: { lat: 10.058, lng: -85.42 },
  },
  {
    nombre: 'Tilarán',
    provincia: 'Guanacaste',
    zona: 'Guanacaste',
    cabecera: { lat: 10.468, lng: -84.968 },
  },
];

function fincaDeEjemplo(
  id: string,
  nombre: string,
  zona: ZonaCafetalera,
  canton: string,
  propietarioId: string,
  perimetro: Coordenada[],
): Finca {
  return {
    id,
    nombre,
    descripcion: null,
    zona,
    perimetro,
    ubicacion: centroide(perimetro),
    canton: CANTONES.find((c) => c.nombre === canton) ?? null,
    areaHectareas: areaHectareas(perimetro),
    propietarioId,
    duenosAdicionales: [],
  };
}

// Finca El Tucán queda justo al este del centro inicial del mapa, para poder probar la superposición
export const FINCAS_REGISTRADAS: Finca[] = [
  fincaDeEjemplo('f-el-tucan', 'Finca El Tucán', 'Tarrazú', 'Tarrazú', 'u-andres', [
    { lat: 9.6588, lng: -84.029 },
    { lat: 9.6584, lng: -84.0262 },
    { lat: 9.6566, lng: -84.0256 },
    { lat: 9.6555, lng: -84.0278 },
    { lat: 9.6568, lng: -84.03 },
  ]),
  fincaDeEjemplo('f-las-brisas', 'Finca Las Brisas', 'Tarrazú', 'Dota', 'u-lucia', [
    { lat: 9.6532, lng: -83.9712 },
    { lat: 9.6529, lng: -83.9684 },
    { lat: 9.651, lng: -83.9681 },
    { lat: 9.6508, lng: -83.9709 },
  ]),
  fincaDeEjemplo('f-monte-alto', 'Finca Monte Alto', 'Valle Occidental', 'Naranjo', 'u-andres', [
    { lat: 10.1012, lng: -84.3815 },
    { lat: 10.1009, lng: -84.3788 },
    { lat: 10.0991, lng: -84.3792 },
    { lat: 10.0994, lng: -84.3819 },
  ]),
  fincaDeEjemplo('f-la-esperanza', 'Finca La Esperanza', 'Tarrazú', 'León Cortés', 'u-rodrigo', [
    { lat: 9.7102, lng: -84.0601 },
    { lat: 9.7099, lng: -84.0572 },
    { lat: 9.7078, lng: -84.0569 },
    { lat: 9.7081, lng: -84.0598 },
  ]),
  fincaDeEjemplo('f-el-mirador', 'Finca El Mirador', 'Valle Occidental', 'Grecia', 'u-rodrigo', [
    { lat: 10.0758, lng: -84.3148 },
    { lat: 10.0755, lng: -84.3121 },
    { lat: 10.0736, lng: -84.3124 },
    { lat: 10.0739, lng: -84.3151 },
  ]),
];
