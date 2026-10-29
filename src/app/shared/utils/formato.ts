import { Usuario } from '../../core/models/finca.model';

export function formatearHectareas(hectareas: number): string {
  // Fincas pequeñas necesitan un decimal más para no mostrar "0.0"
  return `${hectareas.toFixed(hectareas < 1 ? 2 : 1)} hectáreas`;
}

export function iniciales(usuario: Usuario): string {
  return `${usuario.nombre[0]}${usuario.apellidos[0] ?? ''}`.toUpperCase();
}

export function nombreCorto(usuario: Usuario): string {
  return `${usuario.nombre} ${usuario.apellidos.split(' ')[0]}`.trim();
}

const lista = new Intl.ListFormat('es', { type: 'conjunction' });

export function listar(nombres: string[]): string {
  return lista.format(nombres);
}
