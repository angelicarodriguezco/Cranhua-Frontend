import { Usuario } from '../../core/models/finca.model';

export function formatearHectareas(hectareas: number): string {
  return `${hectareas.toFixed(hectareas < 1 ? 2 : 1)} hectáreas`;
}

export function iniciales(usuario: Usuario): string {
  return `${usuario.nombre[0]}${usuario.apellidos[0] ?? ''}`.toUpperCase();
}

export function nombreCorto(usuario: Usuario): string {
  return `${usuario.nombre} ${usuario.apellidos.split(' ')[0]}`.trim();
}

export function formatearTelefono(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '').slice(-8);
  return `+506 ${digitos.slice(0, 4)}-${digitos.slice(4)}`;
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

const mesAnio = new Intl.DateTimeFormat('es-CR', { month: 'long', year: 'numeric' });

export function formatearMesAnio(fechaIso: string): string {
  const partes = mesAnio.formatToParts(new Date(`${fechaIso}T00:00:00`));
  const mes = partes.find((p) => p.type === 'month')?.value ?? '';
  const anio = partes.find((p) => p.type === 'year')?.value ?? '';
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${anio}`;
}

export function nombreCompleto(usuario: Usuario): string {
  return `${usuario.nombre} ${usuario.apellidos}`.trim();
}
