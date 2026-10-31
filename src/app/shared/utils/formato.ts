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

const fechaCorta = new Intl.DateTimeFormat('es-CR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatearFecha(fechaIso: string): string {
  // Sin hora, "2025-12-01" se lee como UTC y en Costa Rica se mostraría el 30 de noviembre
  return fechaCorta.format(new Date(`${fechaIso}T00:00:00`));
}

const kilos = new Intl.NumberFormat('es-CR');

export function formatearKg(kg: number): string {
  return `${kilos.format(kg)} kg`;
}

const colones = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
});

export function formatearColones(monto: number): string {
  return colones.format(monto);
}
