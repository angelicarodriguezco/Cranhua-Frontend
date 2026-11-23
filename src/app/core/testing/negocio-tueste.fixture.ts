import { environment } from '../../../environments/environment';
import { NegocioTuesteApi } from '../models/negocio-tueste.model';

export const URL_TOSTADORES = `${environment.apiUrl}/api/tostadores`;

export const NEGOCIO_API: NegocioTuesteApi = {
  id: 'n-volcan',
  cuentaId: 'u-mariana',
  nombre: 'Tostaduría Volcán',
  nombreContacto: 'Mariana Castro',
  telefono: '+506 8888-1234',
  correo: 'contacto@volcan.cr',
  descripcion: 'Perfiles claros y medios.',
  canton: 'Tibás',
  provincia: 'San José',
  estilos: ['CLARO', 'MEDIO'],
  portadaUrl: null,
};
