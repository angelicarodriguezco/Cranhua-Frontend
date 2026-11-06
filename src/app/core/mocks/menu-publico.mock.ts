import { MenuPublico } from '../models/menu-publico.model';

const FINCA_LA_CATALINA = {
  id: 'finca-la-catalina',
  nombre: 'Finca La Catalina',
  ubicacion: 'Tarrazú',
};

export const MENUS_PUBLICOS: MenuPublico[] = [
  {
    cafeteriaId: 'c-cafe-brumas',
    nombre: 'Café Brumas',
    ubicacion: 'Escazú, San José',
    cafes: [
      {
        id: 'cafe-espresso-catalina',
        nombre: 'Espresso Finca La Catalina',
        nivelTueste: 'Claro',
        notas: 'Notas a caramelo y cítricos',
        precio: 1500,
        fincaOrigen: FINCA_LA_CATALINA,
      },
      {
        id: 'cafe-cappuccino-catalina',
        nombre: 'Cappuccino Finca La Catalina',
        nivelTueste: 'Medio',
        notas: 'Con leche vaporizada',
        precio: 1800,
        fincaOrigen: FINCA_LA_CATALINA,
      },
      {
        id: 'cafe-cold-brew',
        nombre: 'Cold Brew de la casa',
        nivelTueste: 'Medio',
        notas: 'Extracción en frío, 18 horas',
        precio: 2000,
        fincaOrigen: { id: 'finca-el-roble', nombre: 'Finca El Roble', ubicacion: 'Naranjo' },
      },
    ],
    otrasComidas: [
      { id: 'comida-croissant-almendra', nombre: 'Croissant de almendra', precio: 1200 },
      { id: 'comida-tostada-aguacate', nombre: 'Tostada de aguacate', precio: 2400 },
    ],
  },
];
