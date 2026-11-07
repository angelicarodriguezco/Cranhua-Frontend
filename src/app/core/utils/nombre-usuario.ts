import { Usuario } from '../models/finca.model';

export function usuarioDesdeNombreCompleto(
  id: string,
  nombreCompleto: string,
  correo: string,
): Usuario {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) {
    return { id, nombre: '', apellidos: '', correo };
  }
  if (partes.length === 1) {
    return { id, nombre: partes[0], apellidos: '', correo };
  }
  return {
    id,
    nombre: partes[0],
    apellidos: partes.slice(1).join(' '),
    correo,
  };
}
