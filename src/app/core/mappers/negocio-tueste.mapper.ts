import {
  DatosNegocioTueste,
  NegocioTueste,
  NegocioTuesteApi,
  NegocioTuesteRequestApi,
} from '../models/negocio-tueste.model';
import { nivelTuesteDesdeApi, nivelTuesteHaciaApi } from './tueste.mapper';

export function negocioTuesteDesdeApi(api: NegocioTuesteApi): NegocioTueste {
  return {
    id: api.id,
    nombre: api.nombre,
    descripcion: api.descripcion,
    contacto: api.nombreContacto,
    telefono: api.telefono,
    correo: api.correo,
    canton: { nombre: api.canton, provincia: api.provincia },
    estilos: api.estilos.map(nivelTuesteDesdeApi),
    portadaUrl: api.portadaUrl,
    historialTrazabilidad: api.historialTrazabilidad ?? null,
  };
}

export function cuerpoNegocioTueste(datos: DatosNegocioTueste): NegocioTuesteRequestApi {
  return {
    nombre: datos.nombre,
    nombreContacto: datos.contacto,
    telefono: datos.telefono,
    correo: datos.correo,
    // En el PATCH null conserva la descripción anterior; en blanco la borra
    descripcion: datos.descripcion ?? '',
    canton: datos.canton.nombre,
    provincia: datos.canton.provincia,
    estilos: datos.estilos.map(nivelTuesteHaciaApi),
  };
}
