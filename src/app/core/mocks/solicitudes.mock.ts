import { Solicitud } from '../models/solicitud.model';

export function haceDias(dias: number, hoy = new Date()): string {
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dias);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export const SOLICITUDES: Solicitud[] = [
  {
    id: 'sol-1',
    cosechaId: 'cosecha-geisha-monte-alto',
    finca: 'Monte Alto',
    lote: 'Geisha · Lavado',
    kilos: 40,
    fecha: haceDias(0),
    estado: 'Pendiente',
  },
  {
    id: 'sol-2',
    cosechaId: 'cosecha-caturra-catalina',
    finca: 'La Catalina',
    lote: 'Caturra · Honey',
    kilos: 120,
    fecha: haceDias(1),
    estado: 'Pendiente',
  },
  {
    id: 'sol-3',
    cosechaId: 'cosecha-bourbon-cerro-verde',
    finca: 'Cerro Verde',
    lote: 'Bourbon · Honey',
    kilos: 60,
    fecha: haceDias(3),
    estado: 'Aprobada',
  },
  {
    id: 'sol-4',
    cosechaId: 'cosecha-villa-sarchi-el-cedral',
    finca: 'El Cedral',
    lote: 'Villa Sarchí · Natural',
    kilos: 200,
    fecha: haceDias(12),
    estado: 'Rechazada',
  },
  {
    id: 'sol-5',
    cosechaId: 'cosecha-catuai-los-robles',
    finca: 'Los Robles',
    lote: 'Catuaí · Lavado',
    kilos: 150,
    fecha: haceDias(40),
    estado: 'Aprobada',
  },
  {
    id: 'sol-6',
    cosechaId: 'cosecha-caturra-catalina',
    finca: 'La Catalina',
    lote: 'Caturra · Honey',
    kilos: 80,
    fecha: haceDias(55),
    estado: 'Aprobada',
  },
];
