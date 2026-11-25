import { DetalleTostador, DetalleTostadorApi } from '../models/detalle-tostador.model';
import { TostadorDisponible, TostadorExploracionApi } from '../models/tostador-disponible.model';
import { nivelTuesteDesdeApi } from './tueste.mapper';

function ubicacion(canton: string, provincia: string): string {
  return `${canton}, ${provincia}`;
}

export function tostadorDisponibleDesdeApi(api: TostadorExploracionApi): TostadorDisponible {
  return {
    id: api.id,
    nombre: api.nombre,
    ubicacion: ubicacion(api.canton, api.provincia),
    estilos: api.estilos.map(nivelTuesteDesdeApi),
    kgDisponibles: Number(api.kgDisponibles),
  };
}

export function detalleTostadorDesdeApi(api: DetalleTostadorApi): DetalleTostador {
  const tuestes = api.tuestes.map((t) => ({
    id: t.id,
    finca: t.fincaOrigen,
    variedad: t.variedad,
    nivel: nivelTuesteDesdeApi(t.nivel),
    kgDisponibles: Number(t.kgDisponibles),
  }));
  return {
    id: api.id,
    nombre: api.nombre,
    ubicacion: ubicacion(api.canton, api.provincia),
    estilos: api.estilos.map(nivelTuesteDesdeApi),
    kgDisponibles: tuestes.reduce((total, t) => total + t.kgDisponibles, 0),
    descripcion: api.descripcion ?? '',
    contacto: { nombre: api.nombreContacto, telefono: api.telefono, correo: api.correo },
    tuestes,
  };
}
