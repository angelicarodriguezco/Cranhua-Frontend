import { Pedido } from '../models/pedido.model';

export function fechaIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// Fechas relativas a hoy para que "este mes" tenga datos sin importar cuándo se abra la vista
function haceDias(dias: number): string {
  const hoy = new Date();
  return fechaIso(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dias));
}

export const PEDIDOS: Pedido[] = [
  {
    id: 'ped-1',
    tostador: 'Tostaduría Volcán',
    kilos: 12,
    fecha: haceDias(1),
    estado: 'En camino',
    fechaRecibido: null,
  },
  {
    id: 'ped-2',
    tostador: 'Tostadores del Valle',
    kilos: 8,
    fecha: haceDias(3),
    estado: 'En camino',
    fechaRecibido: null,
  },
  {
    id: 'ped-3',
    tostador: 'Brasa Tostaduría',
    kilos: 15,
    fecha: haceDias(6),
    estado: 'Entregado',
    fechaRecibido: haceDias(0),
  },
  {
    id: 'ped-4',
    tostador: 'Tostaduría Volcán',
    kilos: 10,
    fecha: haceDias(34),
    estado: 'Entregado',
    fechaRecibido: haceDias(31),
  },
  {
    id: 'ped-5',
    tostador: 'Monteverde Tostadores',
    kilos: 5,
    fecha: haceDias(38),
    estado: 'Cancelado',
    fechaRecibido: null,
  },
  {
    id: 'ped-6',
    tostador: 'Tostadores del Valle',
    kilos: 20,
    fecha: haceDias(52),
    estado: 'Entregado',
    fechaRecibido: haceDias(48),
  },
];
