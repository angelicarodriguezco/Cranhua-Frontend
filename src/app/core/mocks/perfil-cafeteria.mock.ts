import { PerfilCafeteria } from '../models/perfil-cafeteria.model';

export const PERFILES_CAFETERIA: PerfilCafeteria[] = [
  {
    id: 'c-cafe-brumas',
    nombre: 'Café Brumas',
    ubicacion: 'Escazú, San José',
    descripcion:
      'Cafetería de especialidad que sirve café costarricense con origen conocido. Cada café ' +
      'del menú indica la finca de donde viene y el tostador que lo preparó.',
    coordenada: { lat: 9.9205, lng: -84.137 },
    cafesTrazables: 3,
    tostadores: [{ id: 'n-tostaduria-volcan', nombre: 'Tostaduría Volcán', ubicacion: 'San José' }],
    horario: 'Lun a sáb, 7:00 a 19:00',
    miembroDesde: '2025-06-10',
    fincas: [
      { id: 'finca-la-catalina', nombre: 'Finca La Catalina', ubicacion: 'Tarrazú' },
      { id: 'finca-el-roble', nombre: 'Finca El Roble', ubicacion: 'Naranjo' },
    ],
  },
];
