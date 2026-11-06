import { PerfilUsuario } from '../models/perfil.model';

export const PERFIL_EJEMPLO: PerfilUsuario = {
  id: 'u-rodrigo-alvarado',
  nombreCompleto: 'Rodrigo Alvarado Castro',
  correo: 'rodrigo@fincalacatalina.cr',
  telefono: '+506 8888-4321',
  ubicacion: 'Finca La Catalina · Tarrazú, Costa Rica',
  biografia:
    'Café de altura cultivado con cariño desde 1998. Tres generaciones dedicadas al mismo cafetal.',
  rol: 'Cafetalero',
  miembroDesde: 2024,
  redes: [
    { tipo: 'instagram', valor: '@fincalacatalina' },
    { tipo: 'whatsapp', valor: '+506 8888-4321' },
  ],
  portadaUrl: null,
  avatarUrl: null,
};
