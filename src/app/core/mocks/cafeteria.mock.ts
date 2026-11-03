import { Cafeteria, CantonReferencia } from '../models/cafeteria.model';
import { Usuario } from '../models/finca.model';

export const CAFETERIA_USUARIO_ACTUAL: Usuario = {
  id: 'u-laura',
  nombre: 'Laura',
  apellidos: 'Méndez Arias',
  correo: 'laura.mendez@ejemplo.cr',
};

export const CANTONES_URBANOS: CantonReferencia[] = [
  { nombre: 'San José', provincia: 'San José', cabecera: { lat: 9.9326, lng: -84.0796 } },
  { nombre: 'Escazú', provincia: 'San José', cabecera: { lat: 9.9189, lng: -84.1397 } },
  { nombre: 'Santa Ana', provincia: 'San José', cabecera: { lat: 9.9325, lng: -84.1825 } },
  { nombre: 'Desamparados', provincia: 'San José', cabecera: { lat: 9.8977, lng: -84.0631 } },
  { nombre: 'Alajuelita', provincia: 'San José', cabecera: { lat: 9.9022, lng: -84.1003 } },
  { nombre: 'Goicoechea', provincia: 'San José', cabecera: { lat: 9.9478, lng: -84.0544 } },
  { nombre: 'Montes de Oca', provincia: 'San José', cabecera: { lat: 9.9347, lng: -84.0508 } },
  { nombre: 'Curridabat', provincia: 'San José', cabecera: { lat: 9.9161, lng: -84.0353 } },
  { nombre: 'Moravia', provincia: 'San José', cabecera: { lat: 9.9614, lng: -84.0486 } },
  { nombre: 'Tibás', provincia: 'San José', cabecera: { lat: 9.9578, lng: -84.0819 } },
  { nombre: 'Heredia', provincia: 'Heredia', cabecera: { lat: 9.9986, lng: -84.1169 } },
  { nombre: 'Santo Domingo', provincia: 'Heredia', cabecera: { lat: 9.9817, lng: -84.0897 } },
  { nombre: 'Belén', provincia: 'Heredia', cabecera: { lat: 9.9789, lng: -84.1847 } },
  { nombre: 'Cartago', provincia: 'Cartago', cabecera: { lat: 9.8644, lng: -83.9194 } },
];

export const CAFETERIA_ACTUAL: Usuario = {
  id: 'u-andres-solano',
  nombre: 'Andrés',
  apellidos: 'Solano',
  correo: 'hola@cafebrumas.cr',
};

const CANTON_ESCAZU = CANTONES_URBANOS.find((c) => c.nombre === 'Escazú') ?? CANTONES_URBANOS[0];

export const CAFETERIA_EJEMPLO: Cafeteria = {
  id: 'c-cafe-brumas',
  nombre: 'Café Brumas',
  contacto: 'Andrés Solano',
  telefono: '+506 8899-4410',
  correo: CAFETERIA_ACTUAL.correo,
  descripcion:
    'Café de especialidad en Escazú. Espacio cálido para disfrutar perfiles claros y medios de origen costarricense.',
  horario: 'Lun–Sáb 7:00–19:00 · Dom 8:00–14:00',
  ubicacion: { lat: 9.9205, lng: -84.137 },
  canton: CANTON_ESCAZU,
  volumenMensual: '25 – 50 kg',
  estilos: ['Claro', 'Medio'],
  propietarioId: CAFETERIA_ACTUAL.id,
  portadaUrl: null,
};
