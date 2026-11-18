import { Cafeteria } from '../models/cafeteria.model';
import { Usuario } from '../models/finca.model';

export const CAFETERIA_USUARIO_ACTUAL: Usuario = {
  id: 'u-laura',
  nombre: 'Laura',
  apellidos: 'Méndez Arias',
  correo: 'laura.mendez@ejemplo.cr',
};

export const CAFETERIA_ACTUAL: Usuario = {
  id: 'u-andres-solano',
  nombre: 'Andrés',
  apellidos: 'Solano',
  correo: 'hola@cafebrumas.cr',
};

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
  canton: { nombre: 'Escazú', provincia: 'San José', cabecera: { lat: 9.9189, lng: -84.1397 } },
  volumenMensual: '25 – 50 kg',
  estilos: ['Claro', 'Medio'],
  propietarioId: CAFETERIA_ACTUAL.id,
  portadaUrl: null,
};
