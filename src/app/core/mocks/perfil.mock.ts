import { PerfilUsuario } from '../models/perfil.model';

export const PERFIL_EJEMPLO: PerfilUsuario = {
  id: 'u-rodrigo-alvarado',
  nombreCompleto: 'Rodrigo Alvarado Castro',
  correo: 'rodrigo@fincalacatalina.cr',
  telefono: '+506 8888-4321',
  roles: ['cafetalero'],
  redes: [
    { tipo: 'instagram', valor: '@fincalacatalina' },
    { tipo: 'whatsapp', valor: '+506 8888-4321' },
  ],
  portadaUrl: null,
  avatarUrl: null,
};
