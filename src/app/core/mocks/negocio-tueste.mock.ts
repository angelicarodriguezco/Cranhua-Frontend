import { NegocioTueste, Tostador } from '../models/negocio-tueste.model';

export const TOSTADOR_ACTUAL: Tostador = {
  id: 'u-mariana',
  nombre: 'Mariana',
  apellidos: 'Castro Rojas',
  correo: 'mariana.castro@ejemplo.cr',
};

export const NEGOCIO_EJEMPLO: NegocioTueste = {
  id: 'n-tostaduria-volcan',
  nombre: 'Tostaduría Volcán',
  descripcion:
    'Tostaduría artesanal en el corazón de San José. Perfiles claros y medios para resaltar la acidez y el dulzor del café costarricense.',
  contacto: 'Mariana Castro',
  telefono: '+506 8888-1234',
  correo: TOSTADOR_ACTUAL.correo,
  ubicacion: { lat: 9.9335, lng: -84.0775 },
  canton: { nombre: 'San José', provincia: 'San José', cabecera: { lat: 9.9326, lng: -84.0796 } },
  estilos: ['Claro', 'Medio'],
  propietarioId: TOSTADOR_ACTUAL.id,
  portadaUrl: null,
};
